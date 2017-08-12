import * as React from 'react';
import { ReactHTML } from 'react';

export type ComponentOrTag = keyof ElementTagNameMap | React.ComponentType;

export interface FormProps {
	element?: ComponentOrTag;
	value: any;
	onChange(x: any);
}

export class AutoForm extends React.Component<FormProps, { value: any }> {
	static defaultProps = {
		element: 'form'
	};

	constructor(props) {
		super(props);
		this.state = {
			value: props.value
		};
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

export function AutoWired<K extends keyof ElementTagNameMap>(
	type: K
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
			...Component.defaultProps as any
		};
	} else {
		Inner.defaultProps = { autowire: true };
	}

	return Inner;
}

export class FormStruct extends React.Component<{ element?: ComponentOrTag; name: string }> {
	static defaultProps = {
		element: 'section'
	};

	render() {
		let Wrapper = this.props.element as React.ComponentType;
		return <Wrapper>{this.props.children}</Wrapper>;
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
					inner(clonedPrefix, clonedValue, clonedElement.props.children)
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

			if (innerElement.props.autowire) {
				let value = '';
				if (innerValue === undefined) {
					innerValue = {};
				}
				if (innerElement.props.name in innerValue) {
					value = innerValue[innerElement.props.name];
				}
				newProps = {
					onChange(event) {
						onChange(prefix.concat(innerElement.props.name), event.target.value);
					},
					value
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
