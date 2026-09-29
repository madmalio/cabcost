import re

with open("frontend/src/constants.ts", "r") as f:
    content = f.read()

# Fix QuoteListItem accidentally getting wood_species and finish_type
content = content.replace(
    """export interface QuoteListItem {
  id: number;
  job_name: string;
  client_name: string;
  status: string;
  wood_species: string;
  finish_type: string;""",
    """export interface QuoteListItem {
  id: number;
  job_name: string;
  client_name: string;
  status: string;"""
)

with open("frontend/src/constants.ts", "w") as f:
    f.write(content)
