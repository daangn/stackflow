import { Children, type PropsWithChildren } from "react";

export function APITable({ children }: PropsWithChildren) {
  const data = Children.toArray(children);
  return (
    <table className="w-full !table text-sm">
      <thead>
        <tr>
          <th align="left">Option</th>
          <th align="left">Type</th>
          <th align="left">Description</th>
        </tr>
      </thead>
      <tbody className="break-all first:[&_td]:font-semibold first:[&_td]:text-carrot600 [&_tr]:!bg-transparent">
        {children.props.children[1].props.children}
        {/* {data.map((child, index) => {
          return (
            <tr key={index} className="!bg-transparent">
              {child.props.children.map((td, index) => {
                return (
                  <td key={index} className="!border-t border-gray-200 !p-2">
                    {td}
                  </td>
                );
              })}
            </tr>
          );
        })} */}
      </tbody>
    </table>
  );
}
