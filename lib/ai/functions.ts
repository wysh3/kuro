export const kuroFunctions = [
    {
        name: "place_order",
        description: "Place a food order for the user with specified items and delivery time",
        parameters: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    description: "List of menu items to order",
                    items: {
                        type: "object",
                        properties: {
                            itemId: { type: "string", description: "Menu item ID" },
                            quantity: { type: "number", description: "Quantity to order" },
                            customization: { type: "string", description: "Optional customization notes" }
                        },
                        required: ["itemId", "quantity"]
                    }
                },
                scheduledTime: {
                    type: "string",
                    description: "ISO timestamp for delivery (optional, defaults to ASAP)"
                },
                specialInstructions: {
                    type: "string",
                    description: "Special delivery or preparation instructions"
                }
            },
            required: ["items"]
        }
    },
    {
        name: "create_meal_plan",
        description: "Generate a personalized meal plan based on user preferences and goals",
        parameters: {
            type: "object",
            properties: {
                duration: {
                    type: "string",
                    enum: ["daily", "weekly", "monthly"],
                    description: "Duration of the meal plan"
                },
                startDate: {
                    type: "string",
                    description: "ISO date for plan start (defaults to today)"
                },
                calorieTarget: {
                    type: "number",
                    description: "Daily calorie target"
                },
                proteinTarget: {
                    type: "number",
                    description: "Daily protein target in grams"
                },
                dietaryRestrictions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Dietary restrictions to consider"
                },
                mealTypes: {
                    type: "array",
                    items: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                    description: "Which meal types to include"
                }
            },
            required: ["duration"]
        }
    },
    {
        name: "get_nutrition_info",
        description: "Retrieve detailed nutritional information for menu items",
        parameters: {
            type: "object",
            properties: {
                itemIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Menu item IDs to get nutrition info for"
                },
                includeAllergens: {
                    type: "boolean",
                    description: "Include allergen information"
                }
            },
            required: ["itemIds"]
        }
    },
    {
        name: "analyze_eating_patterns",
        description: "Analyze user's order history and provide personalized insights",
        parameters: {
            type: "object",
            properties: {
                timeRange: {
                    type: "string",
                    enum: ["week", "month", "quarter", "year"],
                    description: "Time range for analysis"
                },
                focusArea: {
                    type: "string",
                    enum: ["nutrition", "spending", "variety", "health"],
                    description: "Specific area to focus analysis on"
                }
            },
            required: ["timeRange"]
        }
    },
    {
        name: "get_recommendations",
        description: "Get personalized food recommendations based on user preferences and goals",
        parameters: {
            type: "object",
            properties: {
                context: {
                    type: "string",
                    enum: ["breakfast", "lunch", "dinner", "snack", "post-workout", "healthy"],
                    description: "Context for recommendations"
                },
                maxItems: {
                    type: "number",
                    description: "Maximum number of recommendations to return"
                }
            },
            required: ["context"]
        }
    },
    {
        name: "forecast_kitchen_demand",
        description: "Predict kitchen demand for specified date and time (kitchen staff only)",
        parameters: {
            type: "object",
            properties: {
                date: {
                    type: "string",
                    description: "ISO date for forecast"
                },
                timeSlots: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific time slots to forecast (e.g., '12:00-13:00')"
                }
            },
            required: ["date"]
        }
    },
    {
        name: "recommend_inventory",
        description: "Provide inventory recommendations based on demand forecasts (kitchen staff only)",
        parameters: {
            type: "object",
            properties: {
                forecastDays: {
                    type: "number",
                    description: "Number of days to forecast ahead"
                },
                itemIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific items to get recommendations for (optional)"
                }
            },
            required: ["forecastDays"]
        }
    }
]
