import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Communicate } from 'npm:edge-tts-universal'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_VOICES = {
  en: 'en-US-AriaNeural',
  ko: 'ko-KR-SunHiNeural',
} as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const text = String(body.text ?? '').trim()
    const lang = body.lang === 'ko' ? 'ko' : 'en'
    const voice =
      typeof body.voice === 'string' && body.voice.trim()
        ? body.voice.trim()
        : DEFAULT_VOICES[lang]

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 선생님처럼 또박또박하되, 살짝 빠르게
    const communicate = new Communicate(text, {
      voice,
      rate: '+10%',
      pitch: '+0Hz',
    })

    const chunks: Uint8Array[] = []
    for await (const message of communicate.stream()) {
      if (message.type === 'audio' && message.data) {
        chunks.push(message.data)
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const audio = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      audio.set(chunk, offset)
      offset += chunk.length
    }

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
