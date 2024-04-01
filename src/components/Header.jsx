import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FailedMessage, SuccessMessage, WarningMessage } from "./Notifications";

import { useAuthState } from "../context/AuthContext";

import ClipIcon from "../assets/icons/ClipIcon";
import RightArrow from "../assets/icons/RightArrow";

import logo from "../assets/images/logo.png";
import unisat_icon from "../assets/icons/unisatWalletIcon.png";
import MobileMenuOpenIcon from "../assets/icons/MobileMenuOpenIcon";
import MobileMenuCloseIcon from "../assets/icons/MobileMenuCloseIcon";
import Aside from "./Aside";
import { useResponsiveView } from "../utils/customHooks";
import WalletIcon from "../assets/icons/WalletIcon";
import { useToast } from "../hooks/useToast";
import ReactPortal from "./ReactPortal";
import { useDailyVolume } from "../hooks/useDashboard";

const DAY_IN_SECOND = 24 * 60 * 60

function Header({ toggleWalletList, toggleNetworkList, toggleMobileMenu, setToggleMobileMenu }) {

    const { unisatContext, authState } = useAuthState();
    const { messageApi } = useToast();
    const { unisatWallet, connected, setUnisatInstalled, address, network, balance, connectWallet, setConnected } = unisatContext;
    const isMobileView_800 = useResponsiveView();
    const isMobileView_500 = useResponsiveView(500);
    const navigate = useNavigate();
    const [showDisconnect, setShowDisconnect] = useState(false)

    const toastRef = useRef();

    const [currentVolume, setCurrentVolume] = useState(0)
    const { data: volumeList } = useDailyVolume()

    const toggleDisconnect = () => {
        setShowDisconnect(!showDisconnect)
    }

    useEffect(() => {
        if (toggleMobileMenu) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [toggleMobileMenu]);


    useEffect(() => {
        if (toggleMobileMenu) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [toggleMobileMenu]);

    useEffect(() => {
        setCurrentVolume(0)

        if (!volumeList) return;

        let todayVolume = 0
        volumeList.map(item => {
            todayVolume += item.volume
        })

        setCurrentVolume(todayVolume)
    }, [volumeList]);

    return (
        <>
            {toggleMobileMenu && isMobileView_800 && (
                <section className="mobile__menu-container">
                    <Aside setToggleMobileMenu={setToggleMobileMenu} />
                </section>
            )}
            <header className={`header ${authState.preferDark ? "dark-theme" : ""} ${!isMobileView_800 ? 'ml-[312px]' : ''}`}>
                <figure className="logo__container hide-desktop" onClick={() => { navigate('/') }}>
                    <img className="w-[50px] !object-contain" src={logo} alt="logo" />
                </figure>

                <p className="!text-[2rem] mr-[50px]">{`Volume 24H : ${(currentVolume / 1e8).toFixed(2)} BTC`}</p>

                {isMobileView_800 && (<div className="megaWrapper">
                    <button
                        className="d-btn d-btn-primary d-btn-grey flex items-center gap-6"
                        onClick={connected ? toggleDisconnect : connectWallet}
                    >
                        <img src={unisat_icon} width={31} height={31} />
                        {connected ? address?.slice(0, 4) + '...' + address?.slice(-4) : 'Connect'}
                    </button>
                    {connected && <button className="megaMenu absolute top-[100%] left-0 w-full d-btn d-btn-outline d-btn-narrow text-center" onClick={() => { setConnected(false) }}>Disconnect</button>}
                </div>
                )}

                {/* <button className="d-btn d-btn-profile" onClick={toggleNetworkList}>
                    <ClipIcon width="40px" height="40px" />

                    <span className="hide-mobile-s">BTC Testnet</span>
                </button> */}
                {
                    connected && balance && <p className="!text-[2rem]">{`BTC : ${balance.total / 1e8}`}</p>
                }

                {!isMobileView_800 && (<div className="megaWrapper">
                    <button className="d-btn d-btn-outline d-btn-narrow flex items-center gap-6 relative" onClick={connected ? toggleDisconnect : connectWallet}>
                        <img src={unisat_icon} width={31} height={31} />
                        {!connected ? 'Connect' : address?.slice(0, 5) + '...' + address?.slice(-5)}
                    </button>
                    {connected && <button className="megaMenu absolute top-[100%] left-0 w-full d-btn d-btn-outline d-btn-narrow text-center" onClick={() => { setConnected(false) }}>Disconnect</button>}
                </div>
                )}

                {!toggleMobileMenu && isMobileView_800 && (
                    <button onClick={() => setToggleMobileMenu(true)} className="hide-desktop">
                        <MobileMenuOpenIcon classes="icon-xl" viewBox="0 0 42 37" />
                    </button>
                )}

                {toggleMobileMenu && isMobileView_800 && (
                    <button onClick={() => setToggleMobileMenu(false)} className="hide-desktop">
                        <MobileMenuCloseIcon classes="icon-xl" viewBox="0 0 36 37" />
                    </button>
                )}
            </header>
        </>
    );
}

export default Header;
