'use client'

import Image from "next/image";
import {useState} from 'react'
import { Box, Stack , TextField, Button} from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([{
    role:'assistant',
    content: `Hi, I'm a Customer Support agent from Ngoc Hiep Jewelry, how can I help you today?`
  },
])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () =>{
    if (!message.trim() || isLoading) return;
    setIsLoading(true)

    setMessage('')
    setMessages((messages) => [
      ...messages, 
      {role:'user', content:message},
      {role:'assistant',content:''},
    ])
    try {
      const response = await fetch('/api/chat', {
        method:'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, {role:'user', content:message}]),
      })

      if (!response.ok){
        // console.log(error.message)
        throw new Error("Network response could not be resolved!")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while(true) {
        const {done,value} = await reader.read()
        if (done) break
      
        const text = decoder.decode(value || new Int8Array(), {stream:true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length-1]
          let otherMessages = messages.slice(0, messages.length-1)
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content:lastMessage.content + text,
            },
          ]
      })
    }
  } catch(error) {
    console.error("Error:", error)
    setMessages((messages) => 
      [...messages,
        {role:'assistant', content:`I'm Sorry, I'm encoutering some network issues. Please try again later!`},
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Box
    width="100vw"
    height="100vh"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    bgcolor="white">
      <Stack
      direction="column"
      width="600px"
      height="700px"
      border="1px solid black"
      p={2}
      spacing={2}
      >
        <Stack
        direction="column"
        spacing={2}
        flexGrow={1}
        overflow="auto"
        maxHeight="100%">
          {messages.map((message, index) => (
            <Box
            key={index}
            display="flex"
            justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}>
              <Box
              bgcolor={message.role==='assistant' ? 'primary.main' : 'secondary.main'}
              color="white"
              borderRadius={16}
              padding={3}>
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack
        direction="row"
        spacing={2}>
        <TextField
        label="message"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={isLoading}/>
        <Button
        variant="contained" onClick={sendMessage}
        disabled={isLoading}>{isLoading ? 'Sending...' : 'Send'}</Button>
        </Stack>
      </Stack>
    </Box>
  )
}
