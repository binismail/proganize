import { useCallback, useEffect, useState } from 'react'
import { type CarouselApi } from '@/components/ui/carousel'

export function useCarouselAutoplay(api: CarouselApi | null, interval = 5000) {
  const [isPlaying, setIsPlaying] = useState(true)

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const onMouseEnter = useCallback(() => pause(), [pause])
  const onMouseLeave = useCallback(() => play(), [play])

  useEffect(() => {
    if (!api || !isPlaying) return

    const intervalId = setInterval(() => {
      api.scrollNext()
    }, interval)

    return () => clearInterval(intervalId)
  }, [api, interval, isPlaying])

  return {
    isPlaying,
    play,
    pause,
    onMouseEnter,
    onMouseLeave,
  }
}
