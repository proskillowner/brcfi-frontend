import React, { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTotalVolume, useDailyVolume } from "../hooks/useDashboard";

import BitcoinIcon from "../assets/images/rocket.png";

import ratioIcon from "../assets/icons/ratio.svg";
import oridnals from "../assets/icons/ordinals.svg";
import ExchangeIcon from "../assets/icons/ExchangeIcon";
import LinkIcon from "../assets/icons/LinkIcon";
import SwapIcon from "../assets/icons/SwapIcon";
import PoolIcon from "../assets/icons/PoolIcon";
import NFTIcon from "../assets/icons/NFTIcon";
import { Link } from "react-router-dom";
import { dayilyData } from "../utils/chartdata";
import { formatTime } from "../utils/constants";
import useGetURL from "../hooks/useGetChartData";
import useGetChartData from "../hooks/useGetChartData";
import Modal from "../components/Modal";
import LPIcon from "../assets/icons/LPIcon";
import { btcPriceURL } from "../utils/apiRoutes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);
const options = {
    responsive: true,
    scales: {
        x: {
            display: false,
        },
        y: {
            display: true,
        },
    },
};
const periods = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

const labels = ["January", "February", "March", "April", "May", "June", "July"];
const defaultData = {
    labels,
    datasets: [
        {
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: "#448AFF",
            // backgroundColor: "rgb(105, 0, 255,0.3)",
            // fill: true,

            fill: "start",
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
                gradient.addColorStop(0, "#448AFF");
                gradient.addColorStop(1, "#448AFF10");
                return gradient;
            },
            lineTension: 1,
        },
    ],
};

function Dashboard() {
    const [period, setPeriod] = useState(0);
    const [chartData] = useGetChartData();

    const [reactChartData, setReactChartData] = useState(defaultData);

    const [currentPrice, setCurrentPrice] = useState('$0.00');
    const [percent, setPercent] = useState('0.00%');
    const [negativePercent, setNegativePercent] = useState(false)

    const [btcPrice, setBtcPrice] = useState(0)
    const [totalVolume, setTotalVolume] = useState(0)
    const [dailyVolume, setDailyVolume] = useState(0)
    const { data: totalVolumeList } = useTotalVolume()
    const { data: dailyVolumeList } = useDailyVolume()

    useEffect(async () =>  {
        const response = await axios.get(btcPriceURL)
        if (response && response.status === 200) {
            setBtcPrice(response.data.bitcoin.usd)
        }
    }, []);

    useEffect(() => {
        if (!chartData) return
        const labels = chartData[period].map((row) => formatTime(row[0]))
        const data = {
            labels,
            datasets: [
                {
                    data: chartData[period].map((row) => row[1]),
                    borderColor: "#448AFF",
                    fill: "start",
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, "#448AFF");
                        gradient.addColorStop(1, "#448AFF10");
                        return gradient;
                    },
                    lineTension: 0.4,
                },
            ],
        };
        setReactChartData(data)
        const current = chartData[0].slice(-1)[0][1].toFixed(2);
        const start = chartData[period][0][1].toFixed(2);
        const pro = 100 * (current - start) / start;
        setCurrentPrice('$' + current);
        const negative = pro >= 0 ? '+' : '';
        setNegativePercent(pro < 0)
        setPercent(negative + pro.toFixed(2) + '%')
    }, [chartData, period]);

    useEffect(() => {
        setTotalVolume(0)

        if (!totalVolumeList) return;

        let totalVolumeValue = 0
        totalVolumeList.map(item => {
            totalVolumeValue += item.volume
        })

        setTotalVolume(totalVolumeValue)
    }, [totalVolumeList]);

    useEffect(() => {
        setDailyVolume(0)

        if (!dailyVolumeList) return;

        let dailyVolumeValue = 0
        dailyVolumeList.map(item => {
            dailyVolumeValue += item.volume
        })

        setDailyVolume(dailyVolumeValue)
    }, [dailyVolumeList]);

    return (
        <section className="dashboard__container">
            <section className="flex justify-center gap-10 mt-10 mb-5">
                <div className="card flex flex-col items-center justify-center p-10 w-[300px] !py-6">
                    <p className="text-md">Total Volume in USD</p>
                    <h3>{`${(totalVolume * btcPrice / 1e8).toFixed(2)} USD`}</h3>
                </div>

                <div className="card flex flex-col items-center justify-center p-10 w-[300px] !py-6">
                    <p className="text-md">Total Volume in BTC</p>
                    <h3>{`${(totalVolume / 1e8).toFixed(2)} BTC`}</h3>
                </div>

                <div className="card flex flex-col items-center justify-center p-10 w-[300px] !py-6">
                    <p className="text-md">24h Volume in USD</p>
                    <h3>{`${(dailyVolume * btcPrice / 1e8).toFixed(2)} USD`}</h3>
                </div>

                <div className="card flex flex-col items-center justify-center p-10 w-[300px] !py-6">
                    <p className="text-md">24h Volume in BTC</p>
                    <h3>{`${(dailyVolume / 1e8).toFixed(2)} BTC`}</h3>
                </div>
            </section>


            <section className="cards__container">
                <Link to="/swap" className="card glass-effect">
                    <div className="flex items-center exchange-icon">
                        {/* <ExchangeIcon /> */}
                        <h3>Swap</h3>
                    </div>
                    <div className="text-[31px] text-[#6F767E]">{'->'}</div>
                </Link>

                <Link to="/Liquidity" className="card glass-effect">
                    <div className="flex items-center swap-icon">
                        {/* <img src={BitcoinIcon} width={40} height={40}/> */}
                        <h3>Liquidity</h3>
                    </div>
                    <div className="text-[31px] text-[#6F767E]">{'->'}</div>
                </Link>
                <Link to={"/pool"} className="card glass-effect">
                    <div className="flex items-center pool-icon">
                        {/* <LPIcon /> */}
                        <h3>Pool</h3>
                    </div>
                    <div className="text-[31px] text-[#6F767E]">{'->'}</div>
                </Link>
            </section>

            <section className="content">
                <article className="content__detail glass-effect">
                    <header>
                        <div className="left">
                        </div>

                        <div className="btn-group btn-group-vertical lg:btn-group-horizontal bg-white p-1 ">
                            {periods.map((item, index) => (
                                <button
                                    className={`bg-white btn ${index == period && 'btn-active'}`}
                                    key={item}
                                    onClick={() => { setPeriod(index) }}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div className="absolute top-[25px] md:ml-[45%] ml-[30px] text-center">
                        <div className="md:text-[24px] text-[14px]">BTC</div>
                        <div className="md:text-[32px] text-[20px] font-medium">{currentPrice}</div>
                        {negativePercent && <div className="md:text-[18px] text-[12px] text-[#D74136]">{percent}</div>}
                        {!negativePercent && <div className="md:text-[18px] text-[12px] text-[#3BDC68]">{percent}</div>}
                    </div>

                    <Line options={options} data={reactChartData} />
                </article>

                <article className="content__info">
                    <section className="glass-effect">
                        <h3 className="!text-[24px]">Ordinals</h3>
                        <p className="!text-[14px]">
                            This gives anyone the ability to create a market by depositing their
                            crypto assets into a liquidity pool.
                        </p>
                    </section>
                    <section className="glass-effect">
                        <p className="!text-[#448AFF]">Your One-Stop DeFi Hub on Bitcoin. Unlock endless possibilities in the world of BRC20 tokens.</p>
                        {/* <img src={rocketImage} alt="rocket" /> */}
                    </section>
                </article>
            </section>
        </section>
    );
}

export default Dashboard;
