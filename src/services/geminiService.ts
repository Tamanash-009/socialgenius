export interface PostIdea {
  id: string;
  title: string;
  hook: string;
  platform: string;
}

export interface ProfileAnalysis {
  tone: string;
  niche: string[];
  writingStyle: string;
  audienceType: string;
}

export interface PlatformVariants {
  linkedin: { content: string; formatting: string };
  twitter: { content: string; formatting: string };
  reddit: { content: string; formatting: string };
  substack: { content: string; formatting: string };
}

export interface GeneratedPostResponse {
  main: string;
  hashtags: string[];
  platformVariants: PlatformVariants;
}

export async function analyzeProfile(url: string): Promise<{ profileAnalysis: ProfileAnalysis; ideas: PostIdea[] }> {
  const response = await fetch('/api/analyze-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch(e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function generatePost(
  context: string,
  profileAnalysis: ProfileAnalysis
): Promise<GeneratedPostResponse> {
  const response = await fetch('/api/generate-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, profileAnalysis })
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch(e) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.generatedPost;
}
