import Cookies from "cookies";
import type { NextPage, GetServerSideProps } from "next";
import { useState, useEffect } from "react";

import type { AuthContext, Balances, Profile } from "../../types/index";
import { getBalanceForAccounts } from "../../helpers/accounts";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import styles from "../../styles/User.module.css";

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
  const [iban, setIban] = useState("1234 1234 1234 1234");

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
  }, []);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <img
          className={styles.logo}
          src="https://app.1inch.io/assets/images/logo_small.svg#logo_small"
        />
        <span className={styles.selectedAddress}>{isMounted && address}</span>
      </header>
      <h1>Be your own bank.</h1>
      <div className={styles.card}>
        <label>Full Name</label>
        <div className={styles.card_name}>JOHN DOE</div>
        <label>IBAN</label>
        <div className={styles.card_iban}>{iban}</div>
      </div>
      <h2>The Euro in your wallet. Non-custodial & regulated.</h2>

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
