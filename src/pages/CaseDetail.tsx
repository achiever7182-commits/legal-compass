import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Scale, Shield, BookOpen, TrendingUp, Calendar, Trash2, FileEdit, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { fetchCaseById, fetchEvidenceByCaseId, deleteCase } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import CaseFactsPanel from "@/components/case/CaseFactsPanel";
import CaseIntelligencePanel from "@/components/case/CaseIntelligencePanel";
import CaseDecisionBar from "@/components/case/CaseDecisionBar";

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCaseById(id!),
    enabled: !!id,
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: () => fetchEvidenceByCaseId(id!),
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCase(id);
      toast.success("Case deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete case");
    }
  };

  if (caseLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="shimmer w-64 h-8 rounded" />
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Case not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Sub header */}
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/agent?caseId=${id}&mode=draft`)}
              className="flex items-center gap-1.5 text-small bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <FileEdit className="h-4 w-4" />
              Draft Document
            </button>
            <button
              onClick={() => navigate(`/agent?caseId=${id}`)}
              className="flex items-center gap-1.5 text-small bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Scale className="h-4 w-4" />
              Case Analysis
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-small text-destructive hover:text-destructive/80 transition-colors px-3 py-2">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Split layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden"
        >
          {/* Left panel - 60% */}
          <div className="lg:col-span-3 overflow-y-auto border-r border-border">
            <CaseFactsPanel caseData={caseData} evidence={evidence} />
          </div>

          {/* Right panel - 40% */}
          <div className="lg:col-span-2 overflow-y-auto bg-muted/30">
            <CaseIntelligencePanel caseData={caseData} evidence={evidence} />
          </div>
        </motion.div>

        {/* Decision bar */}
        <CaseDecisionBar caseId={id!} />
      </div>
    </Layout>
  );
}
