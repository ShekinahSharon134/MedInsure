import pandas as pd
import numpy as np

df = pd.read_csv('ENHANCED_CLAIMS_2018_2023_FOR_DEMO.csv', low_memory=False)
df = df[df['year'] == 2023].copy()
df['month'] = pd.to_numeric(df['claim_date'], errors='coerce')
df = df[df['month'].between(1, 12)]

monthly = df.groupby('month').agg(
    count=('claim_amount_approved', 'count'),
    approved=('claim_amount_approved', 'sum'),
    requested=('claim_amount_requested', 'sum'),
).reset_index()

print("Month | Count | Approved | Requested")
for i, r in monthly.iterrows():
    print(f"  {int(r['month']):2d}  | {int(r['count']):6,} | ${r['approved']:>12,.0f} | ${r['requested']:>12,.0f}")

total_approved = monthly['approved'].sum()
total_requested = monthly['requested'].sum()
print(f"\nTOTAL approved:  ${total_approved:,.0f}")
print(f"TOTAL requested: ${total_requested:,.0f}")
print(f"Screenshot total: $30,178,000")
print(f"Ratio vs approved:  {30178000/total_approved:.4f}")
print(f"Ratio vs requested: {30178000/total_requested:.4f}")

# Check Jan specifically
jan = monthly[monthly['month'] == 1].iloc[0]
print(f"\nJan approved: ${jan['approved']:,.0f}")
print(f"Jan requested: ${jan['requested']:,.0f}")
print(f"Screenshot Jan: $2,301,600")
print(f"Jan count: {int(jan['count'])}, screenshot: 6245")
