const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
    dangerouslyAllowBrowser: false
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');

/**
 * COMPREHENSIVE PROMPT GENERATOR
 * Creates detailed, structured prompts for agricultural image analysis
 */
const generateComprehensivePrompt = (cropType, growthStage, description, soilType, irrigationType, weatherStr, symptoms = []) => {
    return `You are an expert agricultural AI assistant specializing in crop health diagnosis, disease identification, and agricultural best practices. Your task is to analyze the provided agricultural image with extreme detail and provide actionable insights.

**CONTEXT PROVIDED:**
- Crop Type: ${cropType}
- Growth Stage: ${growthStage}
- User Description: "${description || 'No additional description provided'}"
- Soil Type: ${soilType || 'Unknown'}
- Irrigation Method: ${irrigationType || 'Unknown'}
- Weather Conditions: ${weatherStr}
- Visible Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None specified'}

**YOUR ANALYSIS TASK:**

1. **IMAGE ANALYSIS:**
   - Examine the image carefully for crops, seeds, soil, farm conditions, or disease symptoms
   - Identify what is visible: plant parts (leaves, stems, fruits, roots if visible), soil condition, water status, pests, diseases, or other agricultural elements
   - Note the overall health status of what's visible

2. **DISEASE/ISSUE IDENTIFICATION:**
   - If disease symptoms are present, identify the specific disease/pest/issue with scientific accuracy
   - If the crop appears healthy, state "Healthy Crop" clearly
   - Consider common diseases for ${cropType} at ${growthStage} stage
   - Assess severity based on visible symptoms

3. **DETAILED OBSERVATIONS:**
   - Describe what you see in detail (leaf color, spots, wilting, growth patterns, soil moisture, etc.)
   - Note any abnormalities or concerns
   - Identify potential causes based on environmental factors provided

4. **TREATMENT RECOMMENDATIONS:**
   - Provide specific, actionable treatment steps if issues are found
   - Include organic and chemical options where appropriate
   - Specify timing, dosage, and application methods
   - If healthy, provide maintenance recommendations

5. **PREVENTION & CARE:**
   - Long-term prevention strategies
   - Best practices for ${cropType} cultivation
   - Environmental management tips
   - Monitoring recommendations

6. **GROWTH OPTIMIZATION:**
   - Recommendations for optimal growth based on current stage
   - Nutrient management suggestions
   - Water management advice
   - Expected timeline for recovery (if issues found)

7. **RISK ASSESSMENT:**
   - Current risk level
   - Potential for spread/contamination
   - Weather-related risks
   - Economic impact considerations

**CRITICAL REQUIREMENTS:**
- Be specific and detailed - avoid generic responses
- Use agricultural terminology appropriately
- Provide actionable, step-by-step guidance
- If uncertain, indicate confidence level clearly
- Consider Indian agricultural context and practices
- Reference common issues for ${cropType} in similar conditions

**OUTPUT FORMAT (JSON ONLY):**
Return ONLY valid JSON with this exact structure:
{
    "detectedCrop": "Name of crop identified from image",
    "cropConfidence": 85,
    "disease": "Specific disease name OR 'Healthy Crop' OR 'No Disease Detected'",
    "confidence": 85,
    "severity": "None" | "Low" | "Moderate" | "High" | "Critical",
    "description": "Detailed 3-5 sentence description of what you observe in the image, including specific visual details, symptoms, and overall assessment",
    "detailedAnalysis": {
        "visualObservations": "Detailed description of what is visible in the image",
        "symptomAnalysis": "Analysis of any symptoms present",
        "rootCause": "Likely causes based on visual evidence and context",
        "stageAssessment": "Assessment of crop stage and development status"
    },
    "treatment": [
        "Step 1: Specific treatment action with details",
        "Step 2: Next treatment step",
        "Step 3: Additional treatment if needed"
    ],
    "prevention": [
        "Prevention strategy 1",
        "Prevention strategy 2",
        "Prevention strategy 3"
    ],
    "growthRecommendations": [
        "Recommendation for optimal growth",
        "Nutrient management advice",
        "Water management tip",
        "Timeline expectations"
    ],
    "aiRiskAssessment": {
        "riskLevel": "Low" | "Medium" | "High",
        "fungalRisk": true/false,
        "droughtRisk": true/false,
        "pestRisk": true/false,
        "nutrientDeficiencyRisk": true/false,
        "next7DaysForecast": "Detailed forecast and recommendations",
        "weatherAlert": "Any weather-related alerts",
        "economicImpact": "Brief assessment of potential economic impact"
    },
    "otherIssues": [
        {
            "name": "Additional issue identified",
            "confidence": 75,
            "severity": "Low"
        }
    ],
    "expertiseLevel": "Indicate if expert consultation is recommended",
    "followUpActions": [
        "Action item 1",
        "Action item 2"
    ]
}

**IMPORTANT:** 
- Return ONLY the JSON object, no markdown, no code blocks, no additional text
- Be thorough and detailed in your analysis
- If the image shows healthy crops, provide positive feedback and growth optimization tips
- Always provide actionable, specific recommendations`;
};

/**
 * ENHANCED OPENAI ANALYSIS
 * Uses GPT-4 Vision for detailed image analysis
 */
const analyzeOpenAI = async (imageUrl, prompt) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
        console.log("⚠️ OpenAI API key not configured");
        return null;
    }
    
    try {
        console.log("🤖 Requesting OpenAI GPT-4 Vision...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Using GPT-4o for better vision capabilities
            messages: [
                {
                    role: "system",
                    content: "You are an expert agricultural AI assistant. Always respond with valid JSON only, no markdown formatting."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { 
                            type: "image_url", 
                            image_url: { 
                                url: imageUrl,
                                detail: "high" // High detail for better analysis
                            } 
                        },
                    ],
                },
            ],
            max_tokens: 2000, // Increased for more detailed responses
            temperature: 0.3, // Lower temperature for more consistent, factual responses
            response_format: { type: "json_object" }
        });
        
        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        console.log("✅ OpenAI analysis complete");
        return parsed;
    } catch (err) {
        console.error("❌ OpenAI Error:", err.message);
        if (err.response) {
            console.error("Response:", err.response.data);
        }
        return null;
    }
};

/**
 * ENHANCED GEMINI ANALYSIS
 * Uses Gemini 1.5 Pro for comprehensive analysis
 */
const analyzeGemini = async (imageUrl, prompt) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
        console.log("⚠️ Gemini API key not configured");
        return null;
    }
    
    try {
        console.log("✨ Requesting Gemini 1.5 Pro...");
        
        // Use Gemini 1.5 Pro for better analysis
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2000,
            }
        });

        // Fetch image and convert to base64
        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) {
            throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
        }
        
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

        const result = await model.generateContent([
            {
                text: prompt
            },
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const text = result.response.text();
        
        // Clean markdown code blocks if present
        let jsonText = text.trim();
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Try to extract JSON if wrapped in other text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonText);
        console.log("✅ Gemini analysis complete");
        return parsed;
    } catch (err) {
        console.error("❌ Gemini Error:", err.message);
        if (err.response) {
            console.error("Response:", err.response);
        }
        return null;
    }
};

/**
 * INTELLIGENT RESULT MERGING
 * Combines results from multiple AI sources with smart consensus
 */
const mergeResults = (results) => {
    const validResults = results.filter(r => r !== null && r !== undefined);

    if (validResults.length === 0) {
        console.log("❌ No valid AI results");
        return null;
    }
    
    if (validResults.length === 1) {
        console.log("✅ Single AI result (no merge needed)");
        return validResults[0];
    }

    console.log(`⚖️ Merging ${validResults.length} AI insights...`);

    const r1 = validResults[0];
    const r2 = validResults[1];

    // 1. Disease/Issue Consensus
    const disease1 = (r1.disease || '').toLowerCase();
    const disease2 = (r2.disease || '').toLowerCase();
    
    const sameDisease = disease1 === disease2 || 
                       disease1.includes(disease2) || 
                       disease2.includes(disease1) ||
                       (disease1.includes('healthy') && disease2.includes('healthy'));

    let finalDisease = r1.disease;
    let finalConfidence = Math.max(r1.confidence || 0, r2.confidence || 0);

    if (sameDisease) {
        // Both agree - boost confidence
        finalConfidence = Math.min(95, finalConfidence + 10);
        finalDisease = r1.disease; // Use the more detailed one
    } else {
        // Disagree - use higher confidence, note alternative
        if ((r2.confidence || 0) > (r1.confidence || 0)) {
            finalDisease = r2.disease;
            finalConfidence = r2.confidence;
        }
        // Add alternative diagnosis note
        finalDisease = `${finalDisease} (Alternative: ${r1.confidence > r2.confidence ? r2.disease : r1.disease})`;
    }

    // 2. Merge descriptions (combine insights)
    const combinedDescription = `${r1.description || ''} ${r2.description || ''}`.trim();
    const detailedAnalysis = {
        visualObservations: `${r1.detailedAnalysis?.visualObservations || ''} ${r2.detailedAnalysis?.visualObservations || ''}`.trim() || combinedDescription,
        symptomAnalysis: r1.detailedAnalysis?.symptomAnalysis || r2.detailedAnalysis?.symptomAnalysis || 'Analysis in progress',
        rootCause: r1.detailedAnalysis?.rootCause || r2.detailedAnalysis?.rootCause || 'Multiple factors may be involved',
        stageAssessment: r1.detailedAnalysis?.stageAssessment || r2.detailedAnalysis?.stageAssessment || 'Assessment provided'
    };

    // 3. Merge treatments (unique, comprehensive)
    const allTreatments = [...(r1.treatment || []), ...(r2.treatment || [])];
    const uniqueTreatments = Array.from(new Set(allTreatments.map(t => t.toLowerCase())))
        .map(t => allTreatments.find(orig => orig.toLowerCase() === t))
        .filter(Boolean)
        .slice(0, 6); // Limit to top 6

    // 4. Merge prevention (unique)
    const allPrevention = [...(r1.prevention || []), ...(r2.prevention || [])];
    const uniquePrevention = Array.from(new Set(allPrevention.map(p => p.toLowerCase())))
        .map(p => allPrevention.find(orig => orig.toLowerCase() === p))
        .filter(Boolean)
        .slice(0, 5);

    // 5. Merge growth recommendations
    const allGrowth = [...(r1.growthRecommendations || []), ...(r2.growthRecommendations || [])];
    const uniqueGrowth = Array.from(new Set(allGrowth.map(g => g.toLowerCase())))
        .map(g => allGrowth.find(orig => orig.toLowerCase() === g))
        .filter(Boolean)
        .slice(0, 5);

    // 6. Severity (take maximum)
    const severityLevels = { 'None': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Critical': 4, 'Unknown': 0 };
    const severity1 = severityLevels[r1.severity] || 0;
    const severity2 = severityLevels[r2.severity] || 0;
    const finalSeverity = severity1 > severity2 ? r1.severity : r2.severity;

    // 7. Risk Assessment (merge intelligently)
    const risk1 = r1.aiRiskAssessment || {};
    const risk2 = r2.aiRiskAssessment || {};
    const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const finalRiskLevel = Math.max(
        riskLevels[risk1.riskLevel] || 0,
        riskLevels[risk2.riskLevel] || 0
    );
    const finalRiskLevelStr = Object.keys(riskLevels).find(k => riskLevels[k] === finalRiskLevel) || 'Low';

    // 8. Merge other issues
    const allOtherIssues = [...(r1.otherIssues || []), ...(r2.otherIssues || [])];
    const uniqueOtherIssues = allOtherIssues
        .filter((issue, index, self) => 
            index === self.findIndex(i => i.name?.toLowerCase() === issue.name?.toLowerCase())
        )
        .slice(0, 3);

    return {
        detectedCrop: r1.detectedCrop || r2.detectedCrop || 'Unknown',
        cropConfidence: Math.max(r1.cropConfidence || 0, r2.cropConfidence || 0),
        disease: finalDisease,
        confidence: finalConfidence,
        severity: finalSeverity,
        description: combinedDescription || 'Comprehensive analysis completed',
        detailedAnalysis: detailedAnalysis,
        treatment: uniqueTreatments.length > 0 ? uniqueTreatments : ['Monitor crop health regularly', 'Maintain optimal growing conditions'],
        prevention: uniquePrevention.length > 0 ? uniquePrevention : ['Follow best agricultural practices', 'Regular monitoring'],
        growthRecommendations: uniqueGrowth.length > 0 ? uniqueGrowth : ['Continue current practices', 'Monitor growth progress'],
        aiRiskAssessment: {
            riskLevel: finalRiskLevelStr,
            fungalRisk: risk1.fungalRisk || risk2.fungalRisk || false,
            droughtRisk: risk1.droughtRisk || risk2.droughtRisk || false,
            pestRisk: risk1.pestRisk || risk2.pestRisk || false,
            nutrientDeficiencyRisk: risk1.nutrientDeficiencyRisk || risk2.nutrientDeficiencyRisk || false,
            next7DaysForecast: risk1.next7DaysForecast || risk2.next7DaysForecast || 'Monitor conditions closely',
            weatherAlert: risk1.weatherAlert || risk2.weatherAlert || 'No active alerts',
            economicImpact: risk1.economicImpact || risk2.economicImpact || 'Minimal impact expected'
        },
        otherIssues: uniqueOtherIssues,
        expertiseLevel: r1.expertiseLevel || r2.expertiseLevel || 'Standard consultation recommended',
        followUpActions: [...(r1.followUpActions || []), ...(r2.followUpActions || [])].slice(0, 4)
    };
};

/**
 * FALLBACK MOCK ANALYSIS
 * Provides basic analysis when AI services fail
 */
const mockAnalyze = (cropType, description, weatherContext) => {
    console.log("⚠️ Using fallback mock analysis");
    
    const isHumid = weatherContext?.humidity > 70;
    const isDry = weatherContext?.humidity < 40;
    
    return {
        detectedCrop: cropType,
        cropConfidence: 75,
        disease: 'Analysis Unavailable',
        confidence: 45,
        severity: 'Unknown',
        description: 'AI analysis service is currently unavailable. Please try again or consult with an agricultural expert for detailed diagnosis.',
        detailedAnalysis: {
            visualObservations: 'Unable to analyze image at this time',
            symptomAnalysis: 'Analysis pending',
            rootCause: 'Service unavailable',
            stageAssessment: 'Assessment pending'
        },
        treatment: [
            'Please retry the analysis',
            'Consult with an agricultural expert',
            'Monitor crop conditions closely'
        ],
        prevention: [
            'Maintain optimal growing conditions',
            'Regular monitoring recommended',
            'Follow standard agricultural practices'
        ],
        growthRecommendations: [
            'Continue current practices',
            'Monitor growth progress',
            'Maintain proper irrigation'
        ],
        aiRiskAssessment: {
            riskLevel: 'Medium',
            fungalRisk: isHumid,
            droughtRisk: isDry,
            pestRisk: false,
            nutrientDeficiencyRisk: false,
            next7DaysForecast: 'Unable to provide forecast',
            weatherAlert: 'Service unavailable',
            economicImpact: 'Unable to assess'
        },
        otherIssues: [],
        expertiseLevel: 'Expert consultation recommended',
        followUpActions: [
            'Retry AI analysis',
            'Contact agricultural expert'
        ]
    };
};

/**
 * MAIN ANALYSIS FUNCTION
 * Orchestrates AI analysis with fallback handling
 */
const analyzeCrop = async (imageUrl, cropType, growthStage, description, soilType, irrigationType, weatherContext, symptoms = []) => {
    const weatherStr = weatherContext
        ? `Temperature: ${weatherContext.temperature}°C, Humidity: ${weatherContext.humidity}%, Rainfall: ${weatherContext.rainfall}mm. Forecast: ${weatherContext.forecast || 'Stable conditions'}`
        : "Weather data unavailable";

    const prompt = generateComprehensivePrompt(
        cropType, 
        growthStage, 
        description, 
        soilType, 
        irrigationType, 
        weatherStr,
        symptoms
    );

    console.log(`🔍 Analyzing crop: ${cropType} at ${growthStage} stage`);

    // Parallel execution of both AI services
    const [openAIResult, geminiResult] = await Promise.allSettled([
        analyzeOpenAI(imageUrl, prompt),
        analyzeGemini(imageUrl, prompt)
    ]);

    const r1 = openAIResult.status === 'fulfilled' ? openAIResult.value : null;
    const r2 = geminiResult.status === 'fulfilled' ? geminiResult.value : null;

    if (!r1 && !r2) {
        console.log("❌ Both AI services failed. Using fallback.");
        return mockAnalyze(cropType, description, weatherContext);
    }

    const finalResult = mergeResults([r1, r2].filter(Boolean));
    
    if (!finalResult) {
        console.log("❌ Result merging failed. Using fallback.");
        return mockAnalyze(cropType, description, weatherContext);
    }

    console.log(`✅ Analysis complete: ${finalResult.disease} (${finalResult.confidence}% confidence)`);
    return finalResult;
};

module.exports = { analyzeCrop };
