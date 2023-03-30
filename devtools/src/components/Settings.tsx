import { Options } from "../tabs/ActivitiesTab";
import FloatingButton from "./FloatingButton";
import SettingsIcon from "./icons/SettingsIcon";

export default function Settings({
  options,
  onChangeOption,
}: {
  options: Options;
  onChangeOption: (option: keyof Options, value: boolean) => void;
}) {
  return (
    <FloatingButton icon={<SettingsIcon />}>
      {Object.entries(options).map(([name, value]) => (
        <div
          key={name}
          style={{
            display: "flex",
            gap: "0.25rem",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            name={name}
            id={name}
            checked={value}
            onChange={(e) => {
              onChangeOption(name as keyof Options, e.target.checked);
            }}
          />
          <label htmlFor={name}>{name}</label>
        </div>
      ))}
    </FloatingButton>
  );
}
