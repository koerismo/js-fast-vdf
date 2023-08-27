# fast-vdf
Your average javascript KeyValues processing library, as fast as parsable!

# Installation
```
npm i fast-vdf
```

# Usage
```ts
import { vdf } from 'fast-vdf';

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
// Pair with key "123" does not exist in set!

// Strict behaviour is enabled by default with all KeyVSet methods.
// Since this pair does not exist, this call throws an error.

console.log(root.pair('abc', null));

// The default value can be set to null to
// disable this behaviour, instead returning null.


root.factory()
    .pair('hello', 'world')
    .dir('set')
        .pair('subkey', 'value')
        .back()
    .pair('hello2', 'world');

// Factory objects can be used to quickly create keyvalue structures.
// The above code is equivalent to the below:

root.add(new KeyV('hello', 'world'));
root.add(new KeyVSet('set').add('subkey', 'value'));
root.add(new KeyV('hello2', 'world'));


// After you've created your structure, you can dump it as a formatted
// string with the dump function.

root.dump({
	indent: '\t',
	quote: 'always'
});
```


# API

## Functions
### vdf.**parse**(data: string, options?: SharedParseOptions): KeyVRoot
Parses data into a tree of `KeyV` objects.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### vdf.**json**(data: string, options?: SharedParseOptions): Object
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