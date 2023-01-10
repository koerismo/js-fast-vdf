# js-fast-vdf
Your average Javascript KeyValues processing library, but fast!

# API

## Functions
### parse.**fast**(data: string): Object
Parses the data into an object with index keys and a `length` value.

> **Parameters**
>
> `data` The string to parse.

### parse.**fancy**(data: string): Object
Parses the data into an object with index keys and a `length` value, and creates named shortcut keys.

> **Parameters**
>
> `data` The string to parse.

### core.**parse**(text: string, options: ParseOptions): void
The internal API used by the parse.xyz functions.

> **Parameters**
>
> `text` The string to parse.
>
> `options` The parser configuration.

## Types

### ParseOptions
```ts
interface ParseOptions {
    on_key:   (key: string, value: string, query?: string) => void;
    on_enter: (key: string) => void;
    on_exit:  () => void;
}
```