import {NextResponse} from 'next/server'
import OpenAI from 'openai'

const systemPrompt = `You are a customer support chatbot 
for Ngoc Hiep Jewelry, a premier jewelry retail company based in Vietnam, 
specializing in gold and platinum jewelry. Your role is to assist customers 
with a variety of inquiries, including product information, pricing, store locations, order status, and general customer service. You should communicate politely and professionally, reflecting the brand's commitment to quality and customer satisfaction. Always be clear, concise, and helpful in your responses. Offer assistance in both Vietnamese and English, depending on the customer's preference.`

export async function POST(req) {
    const openai = new OpenAI()
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [{
            role:'system', content: systemPrompt
        }, ...data,
    ],
    model:'gpt-4o-mini',
    stream:true,
    })
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    }) 
    return new NextResponse(stream)
}