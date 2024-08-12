import {
    BedrockRuntimeClient,
    InvokeModelWithResponseStreamCommand,
  } from "@aws-sdk/client-bedrock-runtime";

const systemPrompt = `<|begin_of_text|>
<|start_header_id|>system<|end_header_id|>
You are a customer support chatbot 
for Ngoc Hiep Jewelry, a premier jewelry retail company based in Vietnam, 
specializing in gold and platinum jewelry. Your role is to assist customers 
with a variety of inquiries, including product information, pricing, store locations, order status, and general customer service. 
You should communicate politely and professionally, reflecting the brand's commitment to quality and customer satisfaction. Always be clear, concise, and helpful in your responses. Offer assistance in both Vietnamese and English, depending on the customer's preference.
<|eot_id|>`

const decoder = new TextDecoder()
const bedrock = new BedrockRuntimeClient({region: 'us-west-2',
    credentials: {
        
    }
    
})


async function* makeIterator(prompt){
    const request = {
        prompt,
        // Optional inference parameters:
        max_gen_len: 512,
        temperature: 0.5,
        top_p: 0.9,
      }
    const command = new InvokeModelWithResponseStreamCommand({
        modelId:"meta.llama3-8b-instruct-v1:0",
        constentType:"application/json",
        body:JSON.stringify(request)
    });

    try {
        console.log("call bedrock ...")
        const response = await bedrock.send(command)

        if (response.body) {
            // console.log("this is response",response.body)
            for await (const chunk of response.body) {
                console.log(chunk)
                if (chunk.chunk) {
                    try {
                        const json = JSON.parse(decoder.decode(chunk.chunk.bytes))
                        if  (json.generation) {
                            console.log(json.generation)
                            yield json.generation;
                        }
                    } catch (error) {
                        console.log(error);
                        yield " ";
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

function iteratorToStream(iterator) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } =  await iterator.next()

            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        }
    })
}

export async function GET() {
    const iterator = makeIterator([])
    const stream = iteratorToStream(iterator)
    return new Response(stream)
}

export async function POST(request) {
    const req = await request.json()
    let content = systemPrompt
    for (let i=0; i<req.length; i++){
        let temp = `<|start_header_id|>user<|end_header_id|>
        ${req[i].content}
        <|eot_id|>
        <|start_header_id|>assistant<|end_header_id|>`
        content = content.concat(temp)
    }
    const iterator = makeIterator(content)
    const stream = iteratorToStream(iterator)
    return new Response(stream)
}