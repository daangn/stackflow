export function APITable({ children, hasDefaultValue = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm my-4">
        <thead>
          <tr className="border-b py-4 text-left dark:border-neutral-700">
            <th className="py-2 px-4 font-semibold">Option</th>
            <th className="py-2 px-4 font-semibold">Type</th>
            <th className="py-2 px-4 font-semibold">Description</th>
            {hasDefaultValue && (
              <th className="py-2 px-4 font-semibold">Default</th>
            )}
          </tr>
        </thead>
        <tbody className="first:[&_td]:font-semibold first:[&_td]:text-carrot600 [&_tr]:!bg-transparent [&_td]:!border-none [&:nth-child(4)]:[&_td]:text-red700 break-keep">
          {children.props.children[1].props.children}
        </tbody>
      </table>
    </div>
  );
}
