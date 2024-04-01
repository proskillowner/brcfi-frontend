import useSWR from 'swr'
import axios from 'axios'
import { getVolumeList } from '../utils/apiRoutes';

export const useDailyVolume = function() {
  const currentTime = Date.now();
  const startTime = currentTime - 24*60*60*1000
  const { data } = useSWR("dailyVolume", async() => {
    const response = await axios.get(`${getVolumeList}?start_time=${startTime}&end_time=${currentTime}`)
    if (response && response.data.status === "ok") {
      return response.data.data
    }
    return []
  })

  return { data }
}
