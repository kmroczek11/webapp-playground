import { component$, $, useVisibleTask$, useStore } from "@builder.io/qwik";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi";
import { mainnet, sepolia } from "viem/chains";
import { watchAccount, disconnect, getAccount } from "@wagmi/core";
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from "viem";
import { wagmiAbi } from "~/abi";

// 1. Define constants
const projectId = "1d1b907aef05b5977cc3899e80169434";
const rpc = "https://endpoints.omniatech.io/v1/eth/sepolia/public";

// 2. Create wagmiConfig
const metadata = {
  name: "Web3Modal",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [mainnet, sepolia];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
const modal = createWeb3Modal({ wagmiConfig, projectId, chains });

type TaskStore = {
  btnVal: string;
  networkId: number;
  userAddr: `0x${string}`;
  ethInputVal: string;
};

export default component$(() => {
  const store = useStore<TaskStore>({
    btnVal: "Connect",
    networkId: 0,
    userAddr: "0x",
    ethInputVal: "0",
  });

  useVisibleTask$(() => {
    watchAccount((account) => {
      store.userAddr = account.address ?? "0x";

      if (account.isConnected) {
        store.btnVal = "Disconnect";
        const { selectedNetworkId } = modal.getState();
        store.networkId = selectedNetworkId!;
        store.userAddr = account.address!;
      } else {
        store.btnVal = "Connect";
        store.networkId = 0;
        store.userAddr = "0x";
      }
    });
  });

  const connect = $(() => {
    if (getAccount().isConnected) {
      disconnect();
    } else {
      modal.open();
    }
  });

  const swap = $(async () => {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpc),
    });

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum),
    });

    const [account] = await walletClient.getAddresses();

    try {
      const { request } = await publicClient.simulateContract({
        address: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
        abi: wagmiAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          BigInt(Number(store.ethInputVal) * 1000000000000000000),
          BigInt(0),
          [
            "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", //WETH
            "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", //UNI
          ],
          "0xd2E94c589aC7666beC1261d33b1Ce1bA15a306ED",
          BigInt(Date.now() + 5 * 60 * 1000),
        ],
        account,
      });

      await walletClient.writeContract(request);

      // const { request } = await publicClient.simulateContract({
      //   address: "0x48B43Cc3bbBC68D3c5b9061CB8C0Cc2847EcA1A8",
      //   abi: wagmiAbi,
      //   functionName: "swapExactTokensForTokens",
      //   args: [
      //     "0x51aDC79e7760aC5317a0d05e7a64c4f9cB2d4369",
      //     "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      //     BigInt(Number(store.ethInputVal) * 1000000000000000000),
      //     "0xd2E94c589aC7666beC1261d33b1Ce1bA15a306ED",
      //     BigInt(360000000000),
      //   ],
      //   account,
      // });

      // await walletClient.writeContract({
      //   address: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
      //   abi: wagmiAbi,
      //   functionName: "swapExactTokensForTokens",
      //   args: [
      //     Number(store.ethInputVal) * 1000000000000000000,
      //     1,
      //     [
      //       "0x51aDC79e7760aC5317a0d05e7a64c4f9cB2d4369",
      //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      //     ],
      //     "0xd2E94c589aC7666beC1261d33b1Ce1bA15a306ED",
      //     360000000000,
      //   ],
      //   account,
      // });
    } catch (err) {
      if (err instanceof BaseError) {
        const revertError = err.walk(
          (err) => err instanceof ContractFunctionRevertedError
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? "";
          console.log(errorName);
        }
        console.log(err);
      }
    }
  });

  const inputHandler = $((event: Event, elem: HTMLInputElement) => {
    store.ethInputVal = elem.value;
  });

  return (
    <div class="bg-black h-screen flex items-center justify-center flex-col">
      <div class="w-full max-w-xs">
        <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              WETH
            </label>
            <input
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              min="0"
              step="0.001"
              placeholder="0.000"
              onChange$={inputHandler}
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              UNI
            </label>
            <input
              class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              value={Number(store.ethInputVal) * 4.19067}
              disabled
            />
          </div>
          <div class="mb-4 flex justify-center">
            <button
              onClick$={swap}
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              // disabled={!getAccount().isConnected}
              type="button"
            >
              Swap
            </button>
          </div>
        </form>
      </div>

      <div class="flex items-center justify-center flex-col">
        <button
          onClick$={connect}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {store.btnVal}
        </button>
        <div class="flex justify-center flex-col">
          <span class="text-white text-xs">Network ID: {store.networkId}</span>
          <span class="text-white text-xs">User Address: {store.userAddr}</span>
        </div>
      </div>
    </div>
  );
});
