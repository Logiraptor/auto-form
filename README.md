# Auto-Form

Simple, unopinionated, and declarative form binding for React.

## Usage

To build a form for the following data structure:

```js
value = {
    inner_struct: {
        name: "Bob",
        age: 32
    },
    outer_field: "foobar"
}
```

Render the following JSX:

```jsx
const AutoInput = AutoWired('input');

// in render:
<AutoForm value={value} onChange={...}>
    <FormStruct name="inner_struct">
        <AutoInput name="name" type="text" />
        Additional Text
        <AutoInput name="age" type="number" />
    </FormStruct>
    <AutoInput name="outer_field" type="text" />
</AutoForm>
```

`onChange` will be called with values of the structure above any time a form input changes.


## Overriding rendered html

Both `AutoForm` and `FormStruct` accept a prop called `element` which specifies what component to render wrapping their children. AutoForm defaults to rendering a normal `form`, and FormStruct renders a `section`.

## Custom Input Types

In order for this package to auto-wire form inputs, any inputs should have a boolean prop called autowire with the value `true`. This package exports a higher ordered component called `AutoWired` which adds this prop and defaults it to true. For example, to render a `textarea` tag:

```jsx

const AutoTextArea = AutoWired('textarea');

// in render:
<AutoForm>
    <AutoTextArea name="body" />
</AutoForm>

```
