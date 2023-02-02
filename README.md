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

### core.**comparse**(text: string, options: ComParseOptions): void
The internal API used by the parse.xyz functions.

> **Parameters**
>
> `text` The string to parse.
>
> `options` The parser configuration.
> > `on_key` Fires when a new keyset begins. This function is expected to return the number of value tokens to follow it.
> >
> > `on_value` Fires when a value token is consumed.


## Types

### ParseOptions
```ts
interface ParseOptions {
    on_key:   (key: string, value: string, query?: string) => void;
    on_enter: (key: string) => void;
    on_exit:  () => void;
}

### ComParseOptions
```ts
interface ParseOptions {
    on_key:   (key: string) => number;
    on_enter: (key: string) => void;
    on_exit:  () => void;
}
```