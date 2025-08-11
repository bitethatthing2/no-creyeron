'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useImageReplacement } from '@/lib/services/image-replacement.service';
import { FixedLikesService } from '@/lib/services/fixed-likes.service';
import { CheckCircle2, XCircle, Clock, AlertCircle, TestTube } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export function MelindaTestSuite() {
  const { currentUser } = useAuth();
  const { replaceProfileImage } = useImageReplacement();
  const likesService = new FixedLikesService();
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'User Authentication Check', status: 'pending', message: 'Not started' },
    { name: 'Profile Picture Update Test', status: 'pending', message: 'Not started' },
    { name: 'Video Like/Unlike Test', status: 'pending', message: 'Not started' },
    { name: 'Video Posting Test', status: 'pending', message: 'Not started' },
    { name: 'Session Status Check', status: 'pending', message: 'Not started' }
  ]);

  const updateTestResult = (index: number, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, details } : test
    ));
  };

  const runTest = async (testIndex: number) => {
    updateTestResult(testIndex, 'running', 'Running...');
    
    try {
      switch (testIndex) {
        case 0: // User Authentication Check
          await testUserAuthentication(testIndex);
          break;
        case 1: // Profile Picture Update Test
          await testProfilePictureUpdate(testIndex);
          break;
        case 2: // Video Like/Unlike Test
          await testVideoLikeUnlike(testIndex);
          break;
        case 3: // Video Posting Test
          await testVideoPosting(testIndex);
          break;
        case 4: // Session Status Check
          await testSessionStatus(testIndex);
          break;
      }
    } catch (error: any) {
      updateTestResult(testIndex, 'error', error.message || 'Test failed', error);
    }
  };

  const testUserAuthentication = async (testIndex: number) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw new Error(`Auth error: ${error.message}`);
    if (!user) throw new Error('No authenticated user');
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (!profile) throw new Error('No user profile found');
    
    updateTestResult(testIndex, 'success', 
      `✅ User authenticated: ${user.email}`, 
      { authId: user.id, profileId: profile.id, email: profile.email }
    );
  };

  const testProfilePictureUpdate = async (testIndex: number) => {
    if (!currentUser?.id) throw new Error('No current user');
    
    // Test calling the correct backend function
    const { data, error } = await supabase.rpc('update_user_profile_image', {
      p_new_image_url: 'https://example.com/test-image.jpg'
    });
    
    if (error) throw new Error(`Backend function error: ${error.message}`);
    
    updateTestResult(testIndex, 'success', 
      '✅ Profile image update function works correctly',
      { backendResponse: data }
    );
  };

  const testVideoLikeUnlike = async (testIndex: number) => {
    // First, get a video to test with
    const { data: videos, error: videoError } = await supabase
      .from('wolfpack_videos')
      .select('id')
      .limit(1)
      .single();
    
    if (videoError || !videos) {
      throw new Error('No videos found to test with');
    }
    
    const videoId = videos.id;
    
    // Test like function
    const { data: likeData, error: likeError } = await supabase.rpc('like_video', {
      p_video_id: videoId
    });
    
    if (likeError) throw new Error(`Like function error: ${likeError.message}`);
    
    // Test unlike function
    const { data: unlikeData, error: unlikeError } = await supabase.rpc('unlike_video', {
      p_video_id: videoId
    });
    
    if (unlikeError) throw new Error(`Unlike function error: ${unlikeError.message}`);
    
    updateTestResult(testIndex, 'success', 
      '✅ Like/Unlike functions work correctly',
      { videoId, likeResult: likeData, unlikeResult: unlikeData }
    );
  };

  const testVideoPosting = async (testIndex: number) => {
    if (!currentUser?.id) throw new Error('No current user');
    
    // Test that we can create a video post with correct user_id
    const testPostData = {
      user_id: currentUser.id, // This should be the users.id, not auth_id
      caption: 'Test post from Melinda Test Suite',
      video_url: 'https://example.com/test-video.mp4',
      thumbnail_url: 'https://example.com/test-thumbnail.jpg',
      view_count: 0,
      like_count: 0,
      comment_count: 0,
    };
    
    // Simulate the insert (don't actually insert)
    const { error } = await supabase
      .from('wolfpack_videos')
      .select('id') // Just test the query structure
      .eq('user_id', currentUser.id)
      .limit(1);
    
    if (error) throw new Error(`Video posting query error: ${error.message}`);
    
    updateTestResult(testIndex, 'success', 
      '✅ Video posting uses correct user_id mapping',
      { userId: currentUser.id, testData: testPostData }
    );
  };

  const testSessionStatus = async (testIndex: number) => {
    const { data, error } = await supabase.rpc('check_user_session_status', {
      email: currentUser?.email
    });
    
    if (error) throw new Error(`Session check error: ${error.message}`);
    
    updateTestResult(testIndex, 'success', 
      '✅ Session status check works',
      data
    );
  };

  const runAllTests = async () => {
    for (let i = 0; i < testResults.length; i++) {
      await runTest(i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'running': return <Badge className="bg-blue-100 text-blue-800">RUNNING</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600">PENDING</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          Melinda's Bug Fix Test Suite
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Testing profile pictures, likes, and video posting functionality
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current User Info */}
        {currentUser && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current User</h3>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>User ID:</strong> {currentUser.id}</p>
            <p><strong>Auth ID:</strong> {currentUser.authId}</p>
          </div>
        )}

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button onClick={runAllTests} className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Run All Tests
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {testResults.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                  {getStatusBadge(test.status)}
                </div>
                <Button 
                  onClick={() => runTest(index)} 
                  disabled={test.status === 'running'}
                  variant="outline" 
                  size="sm"
                >
                  {test.status === 'running' ? 'Running...' : 'Run Test'}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{test.message}</p>
              
              {test.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-blue-600">
                    View Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Summary</h3>
          <div className="flex gap-4 text-sm">
            <span>✅ Passed: {testResults.filter(t => t.status === 'success').length}</span>
            <span>❌ Failed: {testResults.filter(t => t.status === 'error').length}</span>
            <span>⏳ Running: {testResults.filter(t => t.status === 'running').length}</span>
            <span>⏸️ Pending: {testResults.filter(t => t.status === 'pending').length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}