#!/usr/bin/env python3
"""
Build the canonical collection-import transport CSV from the two source exports.

    python3 scripts/build-collection-import.py

Inputs (both one row per physical copy, perfectly row-aligned by set number):
  - data/lot-sold-list-sets.csv        (from the .xlsx — clean numeric/sale data)
  - data/star-wars-inventory-sets.csv  (from the .pdf  — adds Location/Listing/Notes)

Output:
  - data/collection-import.csv         (one row per copy; maps to the DB model)

Authority / reconciliation rules (the two sources differ + are internally messy):
  * legoRef, Cost, Low/High, Sold, Upcoming  -> taken from the xlsx (clean cells).
    (Cost matches the PDF 100%; Low/High differ ~24% where the PDF text-extraction
     was noisy, so the xlsx wins.)
  * Location, Listing Price, Notes           -> taken from the PDF (xlsx lacks them).
  * name        -> canonical = most common spelling per set number (fixes typos
                   like "Ewok Villiage", "Genosis", trailing spaces).
  * disposition -> SOLD if either source marks sold; else STOLEN; else LAYAWAY;
                   else FOR_SALE.
  * sellPrice   -> xlsx Sold preferred, else PDF Sold. Conflicts are flagged.
  * displayPrice-> PDF Listing preferred, else the xlsx Upcoming price.
  * cost "?"/"" -> empty (flagged cost-unknown).
Anything uncertain is recorded in the `flags` column rather than silently dropped.

Transport columns map to the DB as:
  item  (CollectionItem):       legoRef, type, name
  entry (CollectionItemEntry):  condition, location, disposition,
                                isBuild, isBuildWOFigs, isCrack,
                                costPrice, displayPrice, sellPrice
  eval  (CollectionItemEvaluation, source=MANUAL, per legoRef):
                                valueLow, valueHigh
  extra/provenance:             upcomingPrice, notes, srcRow, flags
Prices keep source precision (dollars, may include cents); the importer rounds to
whole dollars for the integer columns.
"""

import csv
import re
from collections import Counter

XLSX = "data/lot-sold-list-sets.csv"
PDF = "data/star-wars-inventory-sets.csv"
OUT = "data/collection-import.csv"

COLUMNS = [
    "legoRef", "type", "name", "canonicalName",
    "condition", "location", "disposition",
    "isBuild", "isBuildWOFigs", "isCrack",
    "costPrice", "displayPrice", "sellPrice",
    "valueLow", "valueHigh", "upcomingPrice", "notes", "srcRow", "flags",
]


def load(path):
    out = []
    with open(path, newline="") as f:
        r = csv.reader(f)
        next(r, None)
        for i, row in enumerate(r):
            if not row or not row[0].strip():
                continue
            if not any(c.isdigit() for c in row[0]):  # skip totals/blank
                continue
            out.append([c.strip() for c in row])
    return out


NUM = re.compile(r"-?\d+(?:\.\d+)?")


def money(s):
    """Normalize a price-ish cell to a numeric string, or '' when unknown."""
    s = (s or "").replace("$", "").replace(",", "").strip()
    if s in ("", "?"):
        return ""
    m = NUM.search(s)
    return m.group(0) if m else ""


def first_num(s):
    m = NUM.search((s or "").replace(",", ""))
    return m.group(0) if m else ""


def norm_name(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def parse_location(loc):
    """PDF Location -> (location, isBuild, isBuildWOFigs, isCrack, hint)."""
    l = (loc or "").lower()
    is_crack = "crack" in l
    is_wofigs = ("w/o figs" in l) or ("without figs" in l) or ("wofigs" in l)
    is_build = "built" in l or "build" in l
    if "storage" in l:
        location = "STORAGE"
    elif "home" in l:
        location = "HOME"
    elif "store" in l:
        location = "STORE"
    else:
        location = "UNKNOWN"  # Crack / Sold / Stolen / blank / garbled
    hint = ""
    if "stolen" in l:
        hint = "STOLEN"
    elif "layaway" in l:
        hint = "LAYAWAY"
    elif l.strip() == "sold":
        hint = "SOLD"
    return location, is_build, is_wofigs, is_crack, hint


def main():
    xl, pdf = load(XLSX), load(PDF)
    n = min(len(xl), len(pdf))

    # Canonical name per set: most common trimmed spelling.
    names = {}
    for r in xl + pdf:
        names.setdefault(r[0], Counter())[norm_name(r[1])] += 1
    canon = {ref: c.most_common(1)[0][0] for ref, c in names.items()}
    varied = {ref for ref, c in names.items() if len([k for k in c if k]) > 1}

    rows = []
    for i in range(n):
        x, p = xl[i], pdf[i]
        ref = x[0]
        flags = []

        # numeric/sale fields from xlsx
        x_sold, x_up, x_cost, x_low, x_high = x[2], x[3], x[4], x[5], x[6]
        # location/listing/notes from pdf
        p_notes, p_sold, p_loc, p_listing = p[5], p[6], p[7], p[8]

        location, is_build, is_wofigs, is_crack, loc_hint = parse_location(p_loc)
        if is_wofigs:
            is_build = True

        cost = money(x_cost)
        if x_cost.strip() in ("?", ""):
            flags.append("cost-unknown")
        if cost == "0":
            flags.append("cost-zero")

        # ── sold reconciliation ──
        up_l = x_up.lower()
        xlsx_layaway = "layaway" in x_sold.lower() or up_l == "layaway"
        sold_x = "" if "layaway" in x_sold.lower() else money(x_sold)
        sold_p = money(p_sold)
        is_sold = bool(sold_x or sold_p or loc_hint == "SOLD")
        sell = sold_x or sold_p
        if sold_x and sold_p and sold_x != sold_p:
            flags.append(f"sold-conflict(xlsx={sold_x},pdf={sold_p})")
        if is_sold and not sell:
            flags.append("sold-no-price")

        # ── disposition ──
        if is_sold:
            disposition = "SOLD"
        elif loc_hint == "STOLEN" or up_l == "stolen":
            disposition = "STOLEN"
        elif xlsx_layaway or loc_hint == "LAYAWAY":
            disposition = "LAYAWAY"
        else:
            disposition = "FOR_SALE"

        # ── display / upcoming price ──
        listing = money(p_listing)
        upcoming = money(x_up) if NUM.fullmatch(x_up.replace(",", "")) else ""
        display = listing or upcoming
        if listing and upcoming and listing != upcoming:
            flags.append(f"listing-vs-upcoming(pdf={listing},up={upcoming})")

        # ── value low/high: xlsx wins, pdf fills blanks ──
        low = money(x_low) or money(p[3])
        high = money(x_high) or money(p[4])

        # ── notes + garbled-pdf detection ──
        notes = norm_name(p_notes)
        if re.search(r"[a-z]{6,}", p_loc) and location == "UNKNOWN" and not loc_hint:
            # long alpha string in the Location cell = PDF text bleed
            flags.append("garbled-pdf-row")
            extra = norm_name(p_loc + " " + p_listing)
            notes = (notes + " | " + extra).strip(" |")
        if ref in varied:
            flags.append("name-variants")

        rows.append({
            "legoRef": ref,
            "type": "SET",
            # original per-row name preserved (fidelity); canonical = typo-resolved
            # majority spelling the importer can use for the single CollectionItem.
            "name": norm_name(x[1]) or norm_name(p[1]),
            "canonicalName": canon.get(ref, norm_name(x[1])),
            "condition": "USED",
            "location": location,
            "disposition": disposition,
            "isBuild": "true" if is_build else "false",
            "isBuildWOFigs": "true" if is_wofigs else "false",
            "isCrack": "true" if is_crack else "false",
            "costPrice": cost,
            "displayPrice": display,
            "sellPrice": sell if is_sold else "",
            "valueLow": low,
            "valueHigh": high,
            "upcomingPrice": upcoming,
            "notes": notes,
            "srcRow": str(i + 2),
            "flags": ";".join(flags),
        })

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    # ── report ──
    print(f"wrote {len(rows)} copies -> {OUT}")
    print(f"unique sets: {len({r['legoRef'] for r in rows})}")
    disp = Counter(r["disposition"] for r in rows)
    loc = Counter(r["location"] for r in rows)
    print("disposition:", dict(disp.most_common()))
    print("location:", dict(loc.most_common()))
    flagged = [r for r in rows if r["flags"]]
    fc = Counter(f.split("(")[0] for r in flagged for f in r["flags"].split(";"))
    print(f"rows with flags: {len(flagged)}")
    print("flag types:", dict(fc.most_common()))


if __name__ == "__main__":
    main()
