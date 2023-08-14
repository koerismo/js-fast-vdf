# js-fast-vdf
Your average Javascript KeyValues processing library, but fast!

```ts
import vdf from 'js-fast-vdf';

const root = vdf.parse(`
"key" "value1"
key value2
set {
	subkey value [hello_world]
}
`);

console.log(root.value('key'));
// "value2"

console.log(root.dir('set').pair('subkey').query);
// "hello_world"

try { root.pair('123'); }
catch(e) { console.warn(e) }
// Strict behaviour is enabled by default with all KeyVSet methods.
// Since this pair does not exist, this call throws an error.

console.log(root.pair('abc', null));
// The default value can be set to null to
// disable this behaviour, instead returning null.
```


# API

## Functions
### parse.**parse**(data: string, options?: SharedParseOptions): KeyVRoot
Parses data into a tree of objects.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### parse.**json**(data: string, options?: SharedParseOptions): Object
Parses data into a regular javascript object.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### core.**parse**(text: string, options: ParseOptions): void
The internal API used by the parse.xyz functions.

> **Parameters**
>
> `text` The string to parse.
>
> `options` The parser configuration.

## Types

### SharedParseOptions
```ts
interface SharedParseOptions {
    escapes: boolean;
}
```

### ParseOptions
```ts
interface ParseOptions {
    on_key:   (key: string, value: string, query?: string) => void;
    on_enter: (key: string) => void;
    on_exit:  () => void;
	escapes:  boolean;
}
```