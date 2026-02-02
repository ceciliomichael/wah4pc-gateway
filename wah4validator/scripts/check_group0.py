import pandas as pd

df = pd.read_excel('2022-Updates-to-the-2012-PSOC.xlsx', sheet_name='Group 0')
print('Columns:', list(df.columns))
print('\nFirst 50 rows:')
print(df.head(50).to_string())