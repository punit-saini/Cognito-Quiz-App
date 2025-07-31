import React from 'react'
import { Text, View } from 'react-native'
import QuizStarter from '../components/quizstarter'

const SoloPlay = () => {
  return (
    <View className='flex-1 justify-center items-center text-2xl bg-slate-500'>
      <Text>solo-play</Text>
      <QuizStarter />
    </View>
  )
}

export default SoloPlay