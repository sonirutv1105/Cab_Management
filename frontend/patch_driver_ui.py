import sys

file_path = "d:/Cab_Management_system/frontend/src/components/DriverManagementView.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# The old modal body is between line 1051 and 1434 (inclusive)
# Note: Python uses 0-based indexing, so line 1051 is index 1050
start_index = 1050
end_index = 1434

new_lines = lines[:start_index] + lines[end_index:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Removed lines {start_index+1} to {end_index}")
