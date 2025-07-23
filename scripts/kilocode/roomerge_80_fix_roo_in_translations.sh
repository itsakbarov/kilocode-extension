#!/bin/bash

# Replace "O Code" with "O Code" in all translation files
# This includes both i18n locale files and package.nls files

# Fix i18n locale JSON files
find src/i18n/locales -name "*.json" -type f -exec sed -i '' -E 's/(^|[^a-zA-Z])O Code([^a-zA-Z]|$)/\1O Code\2/g' {} \;

# Fix package.nls JSON files
find . -name "package.nls*.json" -type f -exec sed -i '' -E 's/(^|[^a-zA-Z])O Code([^a-zA-Z]|$)/\1O Code\2/g' {} \;