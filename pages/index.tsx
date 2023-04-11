import type { NextPage, GetServerSideProps } from "next";
import CryptoJS from "crypto-js";
import Cookies from "cookies";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Web3Provider, JsonRpcSigner } from "@ethersproject/providers";

const baseUrl =
  process.env?.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? "https://1inch-monerium.vercel.app"
    : "http://localhost:8001";

const Home: NextPage<{ params: any }> = ({ params }) => {
  const [provider, setProvider] = useState<Web3Provider>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [selectedAddress, setSelectedAddress] = useState("");
  const router = useRouter();

  const connectWallet = async () => {
    await provider?.send("eth_requestAccounts", []);
  };

  const signMessage = async () => {
    await signer?.signMessage("Hello World");
  };

  useEffect(() => {
    setProvider(new ethers.providers.Web3Provider((window as any).ethereum));
  }, []);

  useEffect(() => {
    if (provider) {
      setSelectedAddress((window as any).ethereum?.selectedAddress);
      setSigner(provider?.getSigner());
    }
  }, [provider]);

  const emiConnect = () => {
    router.push(
      `https://sandbox.monerium.dev/partners/a8c3c65e-69a7-11ed-9804-163e4e07a3b0/auth?${new URLSearchParams(
        params
      ).toString()}`
    );
  };

  return (
    <div className={styles.main}>
      <button
        style={{ margin: "3rem" }}
        className={styles.ibanButton}
        onClick={() => emiConnect()}
      >
        <Image src="/monerium.svg" alt="me" width="24" height="24" />
        Create IBAN
      </button>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const cookies = new Cookies(req, res);

  // Random generated string.
  const codeVerifier = CryptoJS.lib.WordArray.random(64).toString();

  // code_challenge = base64urlEncode(SHA256(ASCII(code_verifier)))
  const codeChallenge = CryptoJS.enc.Base64url.stringify(
    CryptoJS.SHA256(codeVerifier)
  );

  // A server endpoint of yours, that can't expose secrets to the client.
  const redirectUri = `${baseUrl}/api/integration/monerium`;

  // You will need to store the codeVerifier and codeChallenge for later.
  const cookieName = "monerium-state";

  const params = {
    client_id: "7c92dcf7-b90a-4ff4-98e8-3c7d6c7f4afc",
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: cookieName,
  };

  cookies.set(
    cookieName,
    JSON.stringify({ ...params, code_verifier: codeVerifier })
  );

  return {
    props: { params }, // will be passed to the page component as props
  };
};
export default Home;
