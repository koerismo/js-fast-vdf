# js-fast-vdf
Your average Javascript KeyValues processing library, but fast!

# API

## Functions
### parse.**parse**(data: string): KeyVRoot
Parses data into a tree of objects.

> **Parameters**
>
> `data` The string to parse.

### parse.**json**(data: string): Object
Parses data into a regular javascript object.

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