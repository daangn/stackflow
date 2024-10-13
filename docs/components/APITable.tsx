export function APITable({ children }) {
  return (
    <table className="w-full border-collapse text-sm my-4">
      <thead>
        <tr className="border-b py-4 text-left dark:border-neutral-700">
          <th className="py-2 px-4 font-semibold">Option</th>
          <th className="py-2 px-4 font-semibold">Type</th>
          <th className="py-2 px-4 font-semibold">Description</th>
        </tr>
      </thead>
      <tbody className="first:[&_td]:font-semibold first:[&_td]:text-carrot600 [&_tr]:!bg-transparent [&_td]:!border-none break-keep">
        {children.props.children[1].props.children}
      </tbody>
    </table>
  );
}
