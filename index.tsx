import * as React from "react";
import { ReactHTML } from "react";

interface Subject {
    name: string;
}

interface MyFormState {
    subject: Subject;
    other: {
        "coolInnerStruct": {
            dob: string;
        };
        age: string;
        "FavoriteFood": string;
    };
}

// export class ExampleAutoWiredForm extends React.Component<{}, MyFormState> {
//     state: MyFormState = {
//         subject: {
//             name: "",
//         },
//         other: {
//             age: "",
//             coolInnerStruct: {
//                 dob: "",
//             },
//             FavoriteFood: "",
//         },
//     };

//     render() {
//         return (
//             <Container>
//                 <h4>CurrentValue:</h4>
//                 <pre>{JSON.stringify(this.state, null, 2)}</pre>

//                 <AutoWiredForm
//                     value={this.state}
//                     onChange={(value) => {
//                         this.setState(value);
//                     }}
//                 >
//                     <FormStruct name="subject">
//                         <AutoInput name="name" type="text" />
//                     </FormStruct>
//                     <span>
//                         <ul>
//                             <li>Unrelated 1</li>
//                         </ul>
//                     </span>
//                     <FormStruct name="other">
//                         <FormStruct name="coolInnerStruct">
//                             <AutoInput name="dob" type="date" />
//                         </FormStruct>

//                         <AutoInput name="age" type="number" />
//                         <span>
//                             <ul>
//                                 <li>Unrelated 2</li>
//                             </ul>
//                         </span>
//                         <AutoInput name="FavoriteFood" type="text" />
//                     </FormStruct>

//                     <FormStruct name="subject">
//                         <AutoInput name="name" type="text" />
//                     </FormStruct>
//                 </AutoWiredForm>
//             </Container>
//         );
//     }
// }

interface StructSchema {
    fields: Field[];
}

interface Field {
    name: string;
    type: Type;
}

type Type = StructSchema | string;

interface FormProps {
    element?: React.ComponentType;
    value: any;
    onChange(x: any);
}

export class AutoForm extends React.Component<FormProps, { schema: StructSchema; value: any }> {
    static defaultProps = {
        element: "form",
    };

    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            schema: { fields: [] },
        };
    }

    componentDidMount() {
        const fields = getSchema(this.props.children);
        this.setState({ schema: { fields } });
    }

    updateState(path: string[], value: any) {
        const newState = this.setValueByPath(path, this.state.value, value);
        this.props.onChange(newState);
        this.setState({ value: newState });
    }

    setValueByPath(path, obj, val) {
        if (path.length === 0) {
            return val;
        }
        const key = path[0];

        if (!(key in obj)) {
            obj[key] = {};
        }

        const newSlot = this.setValueByPath(path.slice(1), obj[key], val);
        obj[key] = newSlot;
        return obj;
    }

    render() {
        const FormComponent = this.props.element as React.ComponentType;
        return (
            <FormComponent>
                {annotate((path, value) => this.updateState(path, value), this.state.value, this.props.children)}
            </FormComponent>
        );
    }
}

export function AutoWired<K extends keyof HTMLElementTagNameMap>(
    type: K,
): React.ComponentType<React.HTMLProps<ElementTagNameMap[K]> & { autowired?: boolean }>;
export function AutoWired<P>(Component: React.ComponentType<P>): React.ComponentType<P & { autowired?: boolean }> {
    const Inner = class extends React.Component {
        render() {
            const { autowire, ...rest } = this.props as any;
            return <Component {...rest} />;
        }
    } as any;

    if (Component.defaultProps) {
        Inner.defaultProps = {
            autowire: true,
            ...Component.defaultProps as any,
        };
    } else {
        Inner.defaultProps = { autowire: true };
    }

    return Inner;
}

export class FormStruct extends React.Component<{ name: string }> {
    render() {
        return <section>{this.props.children}</section>;
    }
}

// Annotate adds value and onChange props to relevant elements
// in children
function annotate(onChange, value, element) {
    function inner(prefix, innerValue, innerElement) {
        function cloneWithAddedProps(clonedElement, clonedValue, clonedPrefix, props) {
            if (React.Children.count(clonedElement.props.children) === 0) {
                return React.cloneElement(clonedElement, { ...clonedElement.props, ...props });
            } else {
                return React.cloneElement(
                    clonedElement,
                    { ...clonedElement.props, ...props },
                    inner(clonedPrefix, clonedValue, clonedElement.props.children),
                );
            }
        }

        // Element can be: an array:
        if (React.Children.count(innerElement) > 1) {
            return React.Children.map(innerElement, (child: any) => {
                return inner(prefix, innerValue, child);
            });
        }

        // An element:
        if (innerElement.props !== undefined) {
            let newProps = {};

            if (innerElement.props.value !== undefined && innerElement.props.name !== undefined) {
                newProps = {
                    onChange(event) {
                        onChange(prefix.concat(innerElement.props.name), event.target.value);
                    },
                };
            }

            if (innerElement.props.autowire) {
                newProps = {
                    onChange(event) {
                        onChange(prefix.concat(innerElement.props.name), event.target.value);
                    },
                    value: innerValue[innerElement.props.name],
                };
            }

            if (innerElement.type === FormStruct) {
                prefix = prefix.concat([ innerElement.props.name ]);
                innerValue = innerValue[innerElement.props.name];
            }

            return cloneWithAddedProps(innerElement, innerValue, prefix, newProps);
        }

        // Something else:
        return innerElement;
    }

    return inner([], value, element);
}

// getSchema discovers the schema of a form from its
// children
function getSchema(element): Field[] {
    function collectFields(children) {
        let fields: Field[] = [];

        React.Children.forEach(children, (child: any) => {
            if (typeof child.props === "undefined") {
                return;
            } else {
                fields = fields.concat(getSchema(child));
                return;
            }
        });

        return fields;
    }

    // if (element.type === AutoInput) {
    //     return [
    //         {
    //             name: element.props.name,
    //             type: element.props.type,
    //         },
    //     ];
    // }

    if (React.Children.count(element) > 1) {
        return collectFields(element);
    }

    if (element.type === FormStruct) {
        const fields: Field[] = collectFields(element.props.children);
        return [ { name: element.props.name, type: { fields } } ];
    }

    return collectFields(element.props.children);
}
