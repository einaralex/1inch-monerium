import Cookies from "cookies";
import type { NextPage, GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import type { AuthContext, Balances, Profile } from "../../types/index";
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import styles from "../../styles/User.module.css";
import { CopyToClipboard } from "react-copy-to-clipboard";

const UserProfile: NextPage<{
  userData: Profile;
  userAuth: AuthContext;
  token: any;
}> = ({ userData, userAuth, token }) => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const [isMounted, setIsMounted] = useState(false);
  const [iban, setIban] = useState("IE 1234 1234 1234 1234");
  const [qr, setQR] = useState();

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
    const fetchProfile = async () => {
      // Fetching balances can take some time, therefore we fetch it after the initial rendering
      return await fetch(`https://api.monerium.dev/profiles/${userData.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (data) => {
        const profile: Balances[] = await data.json();
        setIban(
          profile?.accounts?.find(
            (a) => a.address === address && a?.iban !== undefined
          )?.iban
        );
        return profile;
      });
    };
    fetchProfile();

    setIsMounted(true);

    const generateQrCode = require("sepa-payment-qr-code");

    setQR(
      generateQrCode({
        name: "John Doe",
        iban: iban || "IE 1234 1234 1234 1234",
        amount: 123.45,
        reference: "Salary",
        information: "Powered by Monerium.",
      })
    );
  }, []);

  return (
    <div className={styles.frame}>
      <div className={styles.tophalf}>
        <header className={styles.header}>
          <span className={styles.selectedAddress}>{isMounted && address}</span>

          <img
            className={styles.logo}
            src="https://app.1inch.io/assets/images/logo_small.svg#logo_small"
          />
          <h1>Be your own bank.</h1>
        </header>
        <div className={styles.card}>
          <label>Full Name</label>
          <div className={styles.card_name}>JOHN DOE</div>
          <label>IBAN</label>
          <div className={styles.card_iban}>
            {iban || "IE 1234 1234 1234 1234"}
          </div>
        </div>
        <h2>
          The Euro in your wallet.
          <br /> Non-custodial & regulated.
        </h2>
      </div>
      <div className={styles.qr}>
        <CopyToClipboard text={qr} onCopy={console.log} className={styles.copy}>
          <div>
            <img src={`/api/qr?message=${encodeURI(qr)}`} alt="qrcode" />
          </div>
        </CopyToClipboard>
      </div>
      <footer className={styles.footer}>
        <p>
          Powered by <strong>Monerium</strong>
        </p>
      </footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  const cookies = new Cookies(req, res);
  const userAccess = JSON.parse(cookies.get(query?.pid as string) as string);

  const userData: Profile = await fetch(
    `https://api.monerium.dev/profiles/${userAccess.profile}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAccess.access_token}`,
      },
    }
  ).then(async (data) => {
    return await data.json();
  });

  const userAuth: AuthContext = await fetch(
    `https://api.monerium.dev/auth/context`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAccess.access_token}`,
      },
    }
  ).then(async (data) => {
    return await data.json();
  });

  return {
    props: {
      userData,
      userAuth,
      token: userAccess.access_token,
    }, // will be passed to the page component as props
  };
};

export default UserProfile;
