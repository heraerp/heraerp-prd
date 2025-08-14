'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  BarChart3, 
  Gamepad2,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import educationConfig from '../../config/education.config'

export default function EducationDashboard() {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [studentProgress, setStudentProgress] = useState({
    totalProgress: 65,
    streakDays: 12,
    pointsEarned: 2450,
    rank: 8
  })

  // AI Integration
  const callAI = async (action: string, prompt: string) => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: educationConfig.smartCodes[0] + '.AI.TUTOR.v1',
          task_type: 'learning',
          prompt: `${action}: ${prompt} in ${educationConfig.subject}`,
          fallback_enabled: true
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setAiResponse(result.data.content)
      } else {
        setAiResponse('AI tutor is currently unavailable. Please try again later.')
      }
    } catch (error) {
      setAiResponse('Failed to connect to AI tutor. Check your internet connection.')
    }
    setAiLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-education-bg to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-education-text mb-2">
            {educationConfig.name}
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered learning for {educationConfig.subject}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-primary">{studentProgress.totalProgress}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange-500">{studentProgress.streakDays} days</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold text-green-500">{studentProgress.pointsEarned.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-purple-500">#{studentProgress.rank}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="compete">Compete</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Tutor */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">AI Tutor</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => callAI('Explain', 'core concepts')}
                      disabled={aiLoading}
                      className="p-3 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Explain Concepts
                    </button>
                    <button
                      onClick={() => callAI('Generate', 'practice questions')}
                      disabled={aiLoading}
                      className="p-3 text-sm bg-secondary text-white rounded-lg hover:bg-secondary/90 disabled:opacity-50"
                    >
                      Practice Questions
                    </button>
                  </div>
                  
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      AI is thinking...
                    </div>
                  )}
                  
                  {aiResponse && (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Topics */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Recent Topics</h3>
                <div className="space-y-3">
                  {educationConfig.topics.slice(0, 4).map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{topic.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{topic.difficulty} level</p>
                      </div>
                      <div className="text-right">
                        <Progress value={Math.random() * 100} className="w-20 mb-1" />
                        <p className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Study Tab */}
          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationConfig.topics.map((topic) => (
                <div key={topic.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{topic.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 capitalize">Difficulty: {topic.difficulty}</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => callAI('Explain', topic.name)}
                      className="w-full p-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      Study Now
                    </button>
                    <Progress value={Math.random() * 100} className="w-full" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Practice Modes</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educationConfig.modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => callAI('Generate', `${mode} mode questions`)}
                    className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-medium capitalize">{mode} Mode</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {mode === 'concept' && 'Learn fundamental concepts'}
                      {mode === 'story' && 'Learn through stories'}
                      {mode === 'drill' && 'Practice with repetition'}
                      {mode === 'mock' && 'Take practice exams'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Compete Tab */}
          <TabsContent value="compete" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Leaderboard</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'You', score: studentProgress.pointsEarned, isUser: true },
                  { rank: 2, name: 'Sarah M.', score: 2380 },
                  { rank: 3, name: 'John D.', score: 2245 },
                  { rank: 4, name: 'Emma R.', score: 2156 },
                  { rank: 5, name: 'Mike K.', score: 2089 }
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.isUser ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">#{player.rank}</span>
                      <span className={`font-medium ${player.isUser ? 'text-primary' : ''}`}>
                        {player.name}
                      </span>
                    </div>
                    <span className="font-semibold">{player.score.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
                <div className="space-y-4">
                  {educationConfig.topics.map((topic) => {
                    const progress = Math.floor(Math.random() * 100)
                    return (
                      <div key={topic.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{topic.name}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Achievements</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="font-medium">7-Day Streak</p>
                      <p className="text-sm text-gray-600">Keep up the momentum!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-medium">First Topic Complete</p>
                      <p className="text-sm text-gray-600">Great start to your journey</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
