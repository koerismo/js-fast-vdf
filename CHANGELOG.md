# Changelog

## [3.0.0]
### Changed
- This module has been reconfigured to transpile for ESM. The original code and sourcemaps are also now included.
- The parser has been modified to better match Valve's parser(s), which allow any char to begin an unquoted string.
- The `quote` option has been changed to use an enum (`DumpQuotationType`)
- The json-specific `env` argument has been removed in favor of the new optional `on_query` option. This method is called for every query, and will omit keyvalues based on the return value.

### Fixed
- The parser now correctly evaluates escaped escapes before quote endings.
- Dumping has been updated to escapes strings consistently with the library's parsing.

### Added
- Added optional `on_macro` option for parsing. When a `#macro` is encountered, this method is called with the key, value, and surrounding context. If not present, they are treated as normal keys.
- When parsing strings with escape sequences, the parsed string will now include the evaluated escape sequences rather than just the raw string.

## [2.0.0]
### Changed
- The `types` and `multiline` options now default to false.
- The `auto` quoting mode has been split into `auto` and `auto-typed`.
	- `auto` behaves normally, quoting only values which strictly need to be quoted.
	- `auto-typed` allows fast-vdf to quote string values that might be confused with non-string values. (ex. `"true"`, `"123"`)
- The KeyVRoot/KeyVSet `.value(...)` method has been reworked to be less strict.

### Added
- Methods for reading type-strict values have been added to KeyV. (`.int(...)`, `.float(...)`, `.string()`, `.bool()`, `.vector(...)`)
