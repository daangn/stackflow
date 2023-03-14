import {
  RJSFSchema,
  FieldTemplateProps,
  getInputProps,
  ObjectFieldTemplateProps,
} from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import Form, { withTheme, ThemeProps } from "@rjsf/core";
import * as css from "./Dispatcher.css";
import { useState } from "react";
import { RegisteredActivity } from "@stackflow/core";

// const theme: ThemeProps = {
//   templates: {
//     BaseInputTemplate: (props) => {
//       const {
//         schema,
//         id,
//         options,
//         label,
//         value,
//         type,
//         placeholder,
//         required,
//         disabled,
//         readonly,
//         autofocus,
//         onChange,
//         onBlur,
//         onFocus,
//         rawErrors,
//         hideError,
//         uiSchema,
//         registry,
//         formContext,
//         ...rest
//       } = props;
//       const onTextChange = ({
//         target: { value: val },
//       }: React.ChangeEvent<HTMLInputElement>) => {
//         // Use the options.emptyValue if it is specified and newVal is also an empty string
//         onChange(val === "" ? options.emptyValue || "" : val);
//       };
//       const onTextBlur = ({
//         target: { value: val },
//       }: React.FocusEvent<HTMLInputElement>) => onBlur(id, val);
//       const onTextFocus = ({
//         target: { value: val },
//       }: React.FocusEvent<HTMLInputElement>) => onFocus(id, val);

//       const inputProps = { ...rest, ...getInputProps(schema, type, options) };
//       const hasError = (rawErrors ?? []).length > 0 && !hideError;

//       return (
//         <input
//           id={id}
//           //label={label}
//           value={value}
//           placeholder={placeholder}
//           disabled={disabled}
//           readOnly={readonly}
//           autoFocus={autofocus}
//           //error={hasError}
//           //errors={hasError ? rawErrors : undefined}
//           onChange={onTextChange}
//           onBlur={onTextBlur}
//           onFocus={onTextFocus}
//           className={css.input}
//           {...inputProps}
//         />
//       );
//     },
//     FieldTemplate: (props: FieldTemplateProps) => {
//       const {
//         id,
//         classNames,
//         style,
//         label,
//         help,
//         required,
//         description,
//         errors,
//         children,
//       } = props;
//       return (
//         <div className={`${classNames} ${css.fieldTemplate}`} style={style}>
//           <label htmlFor={id} className={css.label}>
//             {label}
//             {required ? <span className={css.labelRequired}>*</span> : null}
//           </label>
//           {description}
//           {children}
//           {errors}
//           {help}
//         </div>
//       );
//     },
//     ButtonTemplates: {
//       SubmitButton: (props) => {
//         console.log(props);

//         return <></>;
//       },
//       AddButton: (props) => {
//         console.log(props);

//         return <button>add</button>;
//       },
//     },
//     ObjectFieldTemplate: (props: ObjectFieldTemplateProps) => {
//       return <>{props.properties.map((p) => p.content)}</>;
//       //return <div>zz</div>;
//     },
//   },
// };

const testSchema: RJSFSchema = {
  type: "object",
  properties: {
    hello: {
      type: "string",
    },
    world: {
      type: "number",
    },
  },
  required: ["hello"],
};

const schema: RJSFSchema = {
  title: "Todo",
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string", title: "Title", default: "A new task" },
    done: { type: "boolean", title: "Done?", default: false },
  },
};

const nestedSchema = {
  type: "object",
  properties: {
    a: {
      type: "object",
      properties: {
        aa: {
          type: "string",
        },
      },
      required: ["aa"],
    },
    b: {
      type: "string",
    },
    c: {
      type: "boolean",
    },
    d: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
};

//const CustomForm = withTheme(theme);

export default function Dispatcher({
  registeredActivities,
}: {
  registeredActivities: RegisteredActivity[];
}) {
  const [formData, setFormData] = useState(null);
  const [activity, setActivity] = useState("");

  return (
    <div
      style={{
        padding: "1rem",
      }}
    >
      <div>Registered Activities</div>
      <select
        value={activity}
        onChange={(e) => {
          setActivity(e.target.value);
        }}
      >
        {registeredActivities.map((activity) => (
          <option value={activity.name} key={activity.name}>
            {activity.name}
          </option>
        ))}
      </select>
      <Form
        schema={nestedSchema}
        validator={validator}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        showErrorList="top"
      />
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <Button
          onClick={() => {
            alert(JSON.stringify(formData));
          }}
        >
          Push
        </Button>
        <Button onClick={() => {}}>Replace</Button>
        <Button onClick={() => {}}>Pop</Button>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return <button onClick={onClick}>{children}</button>;
}
