import { useConnect } from "wagmi";

import { component$ } from "@builder.io/qwik";

export default component$(() => {
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();

  return (
    <div>
      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick$={() => connect({ connector })}
        >
          {connector.name}
          {!connector.ready && " (unsupported)"}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            " (connecting)"}
        </button>
      ))}

      {error && <div>{error.message}</div>}
    </div>
  );
});
