import { analyzeInvestment} from "../../investicheck/src/utils/riskAnalysis";

export const analyzeInvestmentController = (req, res) => {try {
    const {platfrmName, websiteUrl} = req.body;
    if (!platfrmName || !websiteUrl) {
      return res.status(400).json({
        message: 
        "Platform name and website URL are required" });
    }
    const result = analyzeInvestment(req.body);
    return res.status(200).json({ 
        message: 
        "Analysis completed successfully",
    formData: req.body,
    result });
  } catch (error) {
    console.error("Risk analysis error:", error);
    return res.status(500).json({ 
        message: "Internal server error" });
  }
};