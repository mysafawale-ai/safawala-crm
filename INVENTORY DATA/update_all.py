import openpyxl, os

BASE = "/Users/rahulmedhe/Downloads/INVENTORY SETUP"

# Each category: (folder, filename, [(Product Name, Material, Size, Colour), ...])
CATEGORIES = [

("TALWAR", "TALWAR PRICING.xlsx", [
    ("Royal Sword",        "Metal", "Large", "Brown"),
    ("Dragon Sword",       "Metal", "Large", "White"),
    ("Mughal Sword",       "Metal", "Large", "White"),
    ("Velvet Sword",       "Metal", "Large", "Black"),
    ("Bridal Sword",       "Metal", "Large", "Red"),
    ("Rajput Sword",       "Metal", "Large", "Red"),
    ("Teal Turban Pin",    "Metal", "Free",  "Teal"),
    ("Chrome Sword",       "Metal", "Large", "Black"),
    ("Pearl Sword",        "Metal", "Large", "White"),
    ("Filigree Sword",     "Metal", "Large", "Black"),
    ("Golden Sword",       "Metal", "Large", "White"),
    ("Teak Sword",         "Metal", "Large", "Brown"),
    ("Silver Sword",       "Metal", "Large", "Silver"),
    ("Zari Sword",         "Metal", "Large", "Red"),
    ("Steel Sword",        "Metal", "Large", "Black"),
    ("Ruby Turban Pin",    "Metal", "Free",  "Ruby"),
    ("Heritage Sword",     "Metal", "Large", "Brown"),
    ("Ruby Turban Pin II", "Metal", "Free",  "Ruby"),
    ("Brass Sword",        "Metal", "Large", "Brown"),
    ("Classic Sword",      "Metal", "Large", "Brown"),
    ("Lal Sword",          "Metal", "Large", "Red"),
    ("Ivory Sword",        "Metal", "Large", "White"),
    ("Dragon Sword II",    "Metal", "Large", "Silver"),
    ("Shadow Sword",       "Metal", "Large", "Black"),
    ("Guard Sword",        "Metal", "Large", "Black"),
    ("Sandal Sword",       "Metal", "Large", "Brown"),
    ("Maroon Sword",       "Metal", "Large", "Maroon"),
]),

("BELT", "BELT PRICING.xlsx", [
    ("Agni Belt",  "Brocade", "Free", "Crimson"),
    ("Surya Belt", "Brocade", "Free", "Crimson"),
    ("Ratna Belt", "Brocade", "Free", "Champagne"),
]),

("WAIST", "WAIST PRICING.xlsx", [
    ("Kesar Sash", "Kota", "Free", "Peach"),
    ("Zari Sash",  "Kota", "Free", "Peach"),
]),

("SCARF", "SCARF PRICING.xlsx", [
    ("Kesar Scarf", "Kota",  "Free", "Peach"),
    ("Zari Scarf",  "Kota",  "Free", "Peach"),
    ("Hawa Scarf",  "Satin", "Free", "Chocolate"),
    ("Bahar Scarf", "Satin", "Free", "Red"),
    ("Neela Scarf", "Satin", "Free", "Blue"),
    ("Shahi Scarf", "Satin", "Free", "Teal"),
]),

("KATAR", "KATAR PRICING.xlsx", [
    ("Tej Dagger",   "Metal",  "Small",  "Gold"),
    ("Nag Dagger",   "Metal",  "Medium", "Gold"),
    ("Veer Dagger",  "Metal",  "Large",  "Gold"),
    ("Arjun Dagger", "Metal",  "Set",    "Gold"),
    ("Kundan Dagger","Velvet", "Medium", "Maroon"),
    ("Chandi Dagger","Metal",  "Medium", "Silver"),
    ("Shahi Dagger", "Metal",  "Large",  "Silver"),
]),

("FEATHER", "FEATHER PRICING.xlsx", [
    ("Hansa Feather", "Feather", "Small",  "White"),
    ("Agni Feather",  "Feather", "Medium", "Saffron"),
    ("Mukut Feather", "Feather", "Medium", "White"),
    ("Pearl Feather", "Feather", "Small",  "White"),
    ("Shubh Feather", "Feather", "Medium", "White"),
    ("Ratna Feather", "Feather", "Medium", "White"),
    ("Raja Feather",  "Feather", "Large",  "White"),
    ("Veer Feather",  "Feather", "Medium", "White"),
    ("Tej Feather",   "Feather", "Small",  "White"),
    ("Surya Feather", "Feather", "Large",  "White"),
]),

("NECK", "NECK PRICING.xlsx", [
    ("Kala Cravat",  "Brocade",   "Free", "Black"),
    ("Lal Cravat",   "Brocade",   "Free", "Red"),
    ("Rani Cravat",  "Brocade",   "Free", "Crimson"),
    ("Neeli Cravat", "Jacquard",  "Free", "Navy"),
    ("Bahar Cravat", "Silk",      "Free", "Blue"),
    ("Gulab Cravat", "Jacquard",  "Free", "Peach"),
    ("Raja Cravat",  "Silk",      "Free", "Maroon"),
    ("Shahi Cravat", "Polyester", "Free", "Navy"),
    ("Neel Cravat",  "Polyester", "Free", "Navy"),
    ("Indra Cravat", "Polyester", "Free", "Navy"),
    ("Tej Cravat",   "Silk",      "Free", "Midnight"),
    ("Krishn Cravat","Satin",     "Free", "Black"),
    ("Surya Cravat", "Jacquard",  "Free", "Navy"),
    ("Shyam Cravat", "Silk",      "Free", "Magenta"),
    ("Veer Cravat",  "Silk",      "Free", "Wine"),
]),

("POCKET BROOCH", "POCKET BROOCH PRICING.xlsx", [
    ("Guitar Brooch",       "Metal", "Free", "Gold"),
    ("Spectacle Brooch",    "Metal", "Free", "Gold"),
    ("Cannon Brooch",       "Metal", "Free", "Gold"),
    ("Ewer Brooch",         "Metal", "Free", "Gold"),
    ("Eagle Brooch",        "Metal", "Free", "Gold"),
    ("Crystal Brooch",      "Metal", "Free", "White"),
    ("Medallion Brooch",    "Metal", "Free", "Gold"),
    ("Ship Brooch",         "Metal", "Free", "Gold"),
    ("Floral Brooch",       "Metal", "Free", "Gold"),
    ("Crown Brooch",        "Metal", "Free", "Gold"),
    ("Pearl Crown Brooch",  "Metal", "Free", "White"),
    ("Tiara Brooch",        "Metal", "Free", "White"),
    ("Shield Brooch",       "Metal", "Free", "Silver"),
    ("Hawk Brooch",         "Metal", "Free", "Silver"),
    ("Moustache Brooch",    "Metal", "Free", "Gold"),
    ("Phoenix Brooch",      "Metal", "Free", "Gold"),
    ("Axe Brooch",          "Metal", "Free", "Gold"),
    ("Palace Brooch",       "Metal", "Free", "Black"),
    ("Pearl Brooch",        "Metal", "Free", "White"),
    ("Kundan Brooch",       "Metal", "Free", "White"),
    ("Pearl Chain Brooch",  "Metal", "Free", "Gold"),
    ("Dragon Brooch",       "Metal", "Free", "Silver"),
    ("Betiwale Brooch",     "Metal", "Free", "Red"),
    ("Trishul Brooch",      "Metal", "Free", "Red"),
    ("Royal Brooch",        "Metal", "Free", "Green"),
    ("Crest Brooch",        "Metal", "Free", "Gold"),
    ("Clan Brooch",         "Metal", "Free", "Red"),
    ("Garuda Brooch",       "Metal", "Free", "Red"),
    ("Sun Brooch",          "Metal", "Free", "Gold"),
    ("Surya Brooch",        "Metal", "Free", "Gold"),
    ("Regal Brooch",        "Metal", "Free", "Green"),
]),

]


def update_file(folder, filename, data):
    path = os.path.join(BASE, folder, filename)
    if not os.path.exists(path):
        print(f"  SKIPPED — file not found: {path}")
        return

    wb = openpyxl.load_workbook(path)
    ws = wb.active
    max_col = ws.max_column

    # Row 2 = column headers (2-row header structure)
    ws.cell(row=2, column=max_col+1).value = "Product Name"
    ws.cell(row=2, column=max_col+2).value = "Material"
    ws.cell(row=2, column=max_col+3).value = "Size"
    ws.cell(row=2, column=max_col+4).value = "Colour"

    # Data starts at row 3
    for i, (name, material, size, colour) in enumerate(data):
        row = i + 3
        ws.cell(row=row, column=max_col+1).value = name
        ws.cell(row=row, column=max_col+2).value = material
        ws.cell(row=row, column=max_col+3).value = size
        ws.cell(row=row, column=max_col+4).value = colour

    wb.save(path)
    print(f"  DONE — {filename} ({len(data)} rows updated)")


print("=== Safawala Inventory Update ===\n")
for folder, filename, data in CATEGORIES:
    print(f"Updating {folder}...")
    update_file(folder, filename, data)

print("\nAll done! Open your Excel files to verify.")
