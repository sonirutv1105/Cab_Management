import re

def refactor_models():
    file_path = "models/all_models.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace primary keys
    content = re.sub(
        r"Column\(\s*String\(\d+\)\s*,\s*primary_key=True",
        r"Column(Integer, primary_key=True, autoincrement=True",
        content
    )

    # Replace foreign keys
    content = re.sub(
        r"Column\(\s*String\(\d+\)\s*,\s*ForeignKey",
        r"Column(Integer, ForeignKey",
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Refactored all_models.py successfully.")

if __name__ == "__main__":
    refactor_models()
