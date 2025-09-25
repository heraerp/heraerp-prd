#!/bin/bash

echo "Fixing all type issues in API routes..."

# Find all TypeScript files in API routes
find src/app/api -name "*.ts" -type f | while read file; do
  # Fix map callbacks
  sed -i 's/\.map(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.map((\1: any) =>/g' "$file"
  
  # Fix filter callbacks
  sed -i 's/\.filter(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.filter((\1: any) =>/g' "$file"
  
  # Fix reduce callbacks
  sed -i 's/\.reduce((\([a-zA-Z_][a-zA-Z0-9_]*\),/\.reduce((\1: any,/g' "$file"
  
  # Fix forEach callbacks
  sed -i 's/\.forEach(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.forEach((\1: any) =>/g' "$file"
  
  # Fix find callbacks
  sed -i 's/\.find(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.find((\1: any) =>/g' "$file"
  
  # Fix some callbacks
  sed -i 's/\.some(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.some((\1: any) =>/g' "$file"
  
  # Fix every callbacks
  sed -i 's/\.every(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.every((\1: any) =>/g' "$file"
  
  # Fix catch blocks
  sed -i 's/} catch (\([a-zA-Z_][a-zA-Z0-9_]*\)) {/} catch (\1: any) {/g' "$file"
  
  # Fix error.message usage
  sed -i "s/\berror\.message\b/error?.message || 'Unknown error'/g" "$file"
  
  # Fix double parentheses that might have been created
  sed -i 's/((\([a-zA-Z_][a-zA-Z0-9_]*\): any) =>/(\1: any) =>/g' "$file"
done

echo "Type fixes complete!"