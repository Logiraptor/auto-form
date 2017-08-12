import { AutoForm, AutoWired, FormStruct } from "../";
import "mocha";
import { mount } from "enzyme";
import * as React from "react";
import { expect, use } from "chai";
import * as chaiEnzyme from "chai-enzyme";

use(chaiEnzyme());

before(function() {
    this.jsdom = require("jsdom-global")();
});

after(function() {
    this.jsdom();
});

const AutoInput = AutoWired("input");

function clone(obj) {
    // No sense adding another dependency just to clone literal objects
    return JSON.parse(JSON.stringify(obj));
}

describe("AutoForm", () => {
    it("Binds values passed in to relevant inputs", () => {
        let value = {
            field_name: "Foobar",
        };

        let component = mount(
            <AutoForm value={value} onChange={() => {}}>
                <AutoInput name="field_name" type="text" />
            </AutoForm>,
        );

        expect(component.find("input")).to.have.prop("value", value.field_name);
    });

    it("Binds complex values passed in to relevant inputs", () => {
        let value = {
            inner_struct: {
                one_field: "Bob",
                two_field: 5,
            },
            outer_field: "12/15/2016",
        };

        let component = mount(
            <AutoForm value={value} onChange={() => {}}>
                <FormStruct name="inner_struct">
                    <AutoInput name="one_field" type="text" />
                    <AutoInput name="two_field" type="text" />
                </FormStruct>
                <AutoInput name="outer_field" type="text" />
            </AutoForm>,
        );

        expect(component.find('input[name="one_field"]')).to.have.prop("value", value.inner_struct.one_field);
        expect(component.find('input[name="two_field"]')).to.have.prop("value", value.inner_struct.two_field);
        expect(component.find('input[name="outer_field"]')).to.have.prop("value", value.outer_field);
    });

    it("Triggers on change if any input changes", () => {
        let value = {
            inner_struct: {
                one_field: "Bob",
                two_field: 5,
            },
            outer_field: "12/15/2016",
        };

        let lastValue = {};

        let component = mount(
            <AutoForm
                value={value}
                onChange={(value) => {
                    lastValue = value;
                }}
            >
                <FormStruct name="inner_struct">
                    <AutoInput name="one_field" type="text" />
                    <AutoInput name="two_field" type="text" />
                </FormStruct>
                <AutoInput name="outer_field" type="text" />
            </AutoForm>,
        );

        const inputSelectors = [ 'input[name="one_field"]', 'input[name="two_field"]', 'input[name="outer_field"]' ];

        inputSelectors.forEach((selector, i) => {
            const preChangeValue = clone(lastValue);
            let input = component.find(selector);
            input.simulate("change", { target: { value: `New Value ${i}` } });
            expect(lastValue).not.to.deep.eq(preChangeValue);
        });

        expect(lastValue).to.deep.eq({
            outer_field: "New Value 2",
            inner_struct: {
                one_field: "New Value 0",
                two_field: "New Value 1",
            },
        });
    });

    it("Allows overriding the generated node");
});

describe("AutoWired", () => {
    it("Passes along all props");
});

describe("FormStruct", () => {
    it("Allows overriding the generated node");
});
