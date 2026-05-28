import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Handle style - glowing green dots
const handleStyle = {
  background: '#5EFF00',
  width: '8px',
  height: '8px',
  border: '1.5px solid #000',
  boxShadow: '0 0 6px rgba(94, 255, 0, 0.8)'
};

// ── CUSTOM NODE COMPONENTS WITH MULTIPLE HANDLES (TOP, BOTTOM, LEFT, RIGHT FOR HORIZONTAL & VERTICAL FLOWS) ──

// Generic helper to render 4 handles
const NodeHandles = () => (
  <>
    <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
    <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
    <Handle type="target" position={Position.Left} style={{ ...handleStyle, top: '50%' }} id="left-target" />
    <Handle type="source" position={Position.Right} style={{ ...handleStyle, top: '50%' }} id="right-source" />
  </>
);

// Unified Node wrapper component
const UnifiedNode = ({ category, icon, color, note, draggable, selected, customHandles, children }) => {
  return (
    <div style={{
      background: '#ffffff',
      border: selected ? '2.5px solid #5EFF00' : '1.5px solid #cbd5e1',
      boxShadow: selected ? '0 0 18px rgba(94, 255, 0, 0.4)' : '0 10px 25px rgba(0,0,0,0.06)',
      borderRadius: '14px',
      padding: '16px',
      color: '#0f172a',
      fontFamily: 'Outfit, sans-serif',
      width: '260px',
      height: 'fit-content',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'border 0.2s, box-shadow 0.2s',
      cursor: 'move'
    }}>
      {customHandles ? customHandles : <NodeHandles />}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '800', color: color || '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {category}
        </span>
      </div>

      {note && (
        <div style={{ background: '#fef3c7', border: '1px dashed #f59e0b', borderRadius: '8px', padding: '6px 10px', fontSize: '10px', color: '#b45309', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{note}</span>
        </div>
      )}

      <div style={{
        fontSize: '12.5px',
        color: '#334155',
        marginTop: '6px',
        background: '#f8fafc',
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        lineHeight: '1.4'
      }}>
        {children}
      </div>
    </div>
  );
};

// 💬 Message Node
const MessageNode = ({ data, draggable, selected }) => {
  const buttons = data.buttons || [];
  return (
    <UnifiedNode 
      category="Mensagem" 
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      color="#64748b"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        marginBottom: buttons.length > 0 ? '10px' : '0'
      }}>
        {data.content || 'Sem texto definido...'}
      </div>
      {buttons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          {buttons.map((btn, idx) => (
            <div key={idx} style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {btn.text}
            </div>
          ))}
        </div>
      )}
    </UnifiedNode>
  );
};

// ❓ Question Node
const QuestionNode = ({ data, draggable, selected }) => {
  const fields = data.fields || [];
  return (
    <UnifiedNode 
      category="Pergunta" 
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
      color="#2563eb"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{ fontWeight: '750', marginBottom: '8px', color: '#0f172a' }}>{data.questionText || 'Qual é a sua dúvida?'}</div>
      {fields.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {fields.map((f, idx) => (
            <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
              [{f.type.toUpperCase()}] {f.label || 'Campo'}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum campo de resposta configurado</div>
      )}
    </UnifiedNode>
  );
};

// ⚡ Action Node
const ActionNode = ({ data, draggable, selected }) => {
  const actionsList = data.actions || [];
  return (
    <UnifiedNode 
      category="Ação" 
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
      color="#b45309"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      {actionsList.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Clique para adicionar ação
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {actionsList.map((act, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#b45309', background: '#fff', border: '1px solid #cbd5e1', padding: '5px 8px', borderRadius: '6px' }}>
              ⚡ {act.type === 'tag_add' ? `Adicionar tag: ${act.value}` : act.type === 'tag_remove' ? `Remover tag: ${act.value}` : act.value}
            </div>
          ))}
        </div>
      )}
    </UnifiedNode>
  );
};

// 🎛️ Condition Node
const ConditionNode = ({ id, data, draggable, selected }) => {
  const conditions = data.conditions || [];

  const customHandles = (
    <>
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, top: '50%' }} id="left-target" />
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
    </>
  );

  return (
    <UnifiedNode 
      category="Condição" 
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>}
      color="#0d9488"
      note={data.note}
      draggable={draggable}
      selected={selected}
      customHandles={customHandles}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
        {conditions.map((cond, idx) => {
          const rowKey = `cond-source-${idx}`;
          return (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              fontWeight: '800', 
              color: '#0f172a', 
              paddingBottom: '6px', 
              borderBottom: '1px solid #e2e8f0',
              position: 'relative'
            }}>
              <span style={{ color: '#0d9488' }}>Condição {idx + 1}: {cond.value || 'Contém'}</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={rowKey} 
                  style={{ 
                    ...handleStyle, 
                    right: '-24px', 
                    top: '50%', 
                    transform: 'translateY(-50%)'
                  }} 
                />
              </div>
            </div>
          );
        })}

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: '12px', 
          fontWeight: '800', 
          color: '#64748b',
          position: 'relative'
        }}>
          <span>Caso contrário</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Handle 
              type="source" 
              position={Position.Right} 
              id="cond-source-else" 
              style={{ 
                ...handleStyle, 
                right: '-24px', 
                top: '50%', 
                transform: 'translateY(-50%)'
              }} 
            />
          </div>
        </div>
      </div>
    </UnifiedNode>
  );
};

// 🔀 Split Node
const SplitNode = ({ data, draggable, selected }) => {
  const pct = data.splitPercent ?? 50;
  const labelA = data.labelA || 'Grupo A';
  const labelB = data.labelB || 'Grupo B';
  return (
    <UnifiedNode
      category="Dividir (Teste A/B)"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M4 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M12 2v20M2 18l10 4 10-4"/></svg>}
      color="#6b21a8"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', fontWeight: '800' }}>
        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(168, 85, 247, 0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '6px', padding: '6px 4px' }}>
          <div style={{ color: '#a855f7', marginBottom: '2px' }}>{labelA}</div>
          <div style={{ color: '#6b21a8', fontSize: '13px', fontWeight: '900' }}>{pct}%</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(236, 72, 153, 0.07)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '6px', padding: '6px 4px' }}>
          <div style={{ color: '#ec4899', marginBottom: '2px' }}>{labelB}</div>
          <div style={{ color: '#be185d', fontSize: '13px', fontWeight: '900' }}>{100 - pct}%</div>
        </div>
      </div>
    </UnifiedNode>
  );
};

// 📧 Email Node
const EmailNode = ({ data, draggable, selected }) => {
  return (
    <UnifiedNode
      category="E-mail"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
      color="#db2777"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{
        lineHeight: '1.4'
      }}>
        {data.subject || 'Enviar E-mail Comercial'}
      </div>
    </UnifiedNode>
  );
};

// ➡️ GoTo Node
const GoToNode = ({ data, draggable, selected }) => {
  return (
    <UnifiedNode
      category="Ir para"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.5"><path d="M18 8h6v6"/><path d="M24 8L14 18l-6-6-8 8"/></svg>}
      color="#db2777"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{
        lineHeight: '1.4',
        textAlign: 'center'
      }}>
        {data.targetNodeId ? `Ir para Etapa #${data.targetNodeId}` : 'Ir para etapa posterior'}
      </div>
    </UnifiedNode>
  );
};

// 🕐 Atraso Node
const DelayNode = ({ data, draggable, selected }) => {
  return (
    <UnifiedNode
      category="Atraso Inteligente"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
      color="#b45309"
      note={data.note}
      draggable={draggable}
      selected={selected}
    >
      <div style={{
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        Atraso de {data.time || '30 minutos'}
      </div>
    </UnifiedNode>
  );
};

// ── INNER FLOW EDITOR CONTENT COMPONENT ──────────────────────────────────────

function FlowEditorContent({ token, setIsSidebarOpen }) {
  const { platform } = useParams();
  const navigate = useNavigate();
  const { zoomIn, zoomOut, fitView, setCenter, screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (platform) {
      setNodes(initialNodesByPlatform[platform] || []);
      setEdges(initialEdgesByPlatform[platform] || []);
    }
  }, [platform, setNodes, setEdges]);

  // States
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('Editar');
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 200, y: 200 });

  // Question editing sub-states (grids & panels)
  const [questionMode, setQuestionMode] = useState(null); // null / 'text'
  const [paginationOpen, setPaginationOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Email state bindings
  const [emailProfile, setEmailProfile] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('==No Template==');

  // Node inputs state bindings
  const [editNote, setEditNote] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editButtons, setEditButtons] = useState([]);
  const [editActionText, setEditActionText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editSubject, setEditSubject] = useState('');

  // History and clipboard states
  const [history, setHistory] = useState([]);
  const [copiedNode, setCopiedNode] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Global AI Flow Creator states
  const [isGlobalAiOpen, setIsGlobalAiOpen] = useState(false);
  const [globalAiPrompt, setGlobalAiPrompt] = useState('');
  const [isGlobalAiGenerating, setIsGlobalAiGenerating] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const match = nodes.find(n =>
      (n.data.label || '').toLowerCase().includes(q) ||
      (n.data.content || '').toLowerCase().includes(q) ||
      (n.data.questionText || '').toLowerCase().includes(q) ||
      (n.data.subject || '').toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
    if (match) {
      setCenter(match.position.x + 130, match.position.y + 80, { zoom: 1.2, duration: 500 });
    }
  };

  const handleGlobalAiGenerate = async () => {
    const key = import.meta.env.VITE_GEMINI_API_KEY || userApiKey;
    if (!key) {
      toast.error("Por favor, insira sua Chave de API do Gemini!");
      return;
    }

    if (!globalAiPrompt.trim()) {
      toast.error("Descreva o fluxo que deseja gerar!");
      return;
    }

    setIsGlobalAiGenerating(true);
    const loadingToastId = toast.loading("IA estruturando seu fluxo completo...");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert conversasional designer and marketing automation engineer.
The user wants a complete chatbot automation flow described as:
"${globalAiPrompt}"

Generate a clean, modern, fully-connected ReactFlow nodes and edges structure representing this complete automation flow.
Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown or code blocks. Do not add any text before or after the JSON.

JSON Schema:
{
  "nodes": [
    {
      "id": "1",
      "type": "message" | "question" | "action" | "condition" | "split" | "email" | "goto" | "delay",
      "position": { "x": number, "y": number },
      "data": {
        "label": "Short title of node",
        // for message node:
        "content": "Message content text",
        "buttons": [{ "text": "Button label" }],
        // for question node:
        "questionText": "Question to lead?",
        "fields": [{ "type": "text"|"email"|"phone", "label": "Label" }],
        // for action node:
        "actions": [{ "type": "tag_add", "value": "TagValue" }],
        // for condition node:
        "conditions": [{ "value": "ConditionValue" }],
        // for delay node:
        "time": "Amount of delay (e.g. 5 minutos)",
        // for split node:
        "splitPercent": 50,
        "labelA": "Grupo A",
        "labelB": "Grupo B",
        // for email node:
        "subject": "Subject of email",
        "body": "Body text",
        // for goto node:
        "targetNodeId": "Node ID to jump to"
      }
    }
  ],
  "edges": [
    {
      "id": "e-1-2",
      "source": "1",
      "target": "2",
      "sourceHandle": "right-source" | "cond-source-0" | "cond-source-else", // use 'right-source' for standard nodes, 'cond-source-0', 'cond-source-else' for condition nodes
      "targetHandle": "left-target",
      "animated": true,
      "style": { "stroke": "#5EFF00", "strokeWidth": 2 }
    }
  ]
}

Layout guidelines:
- Position nodes horizontally from left to right. Set first node at { "x": 100, "y": 150 }.
- Increment X by 350 for each consecutive node to ensure a clean, modern layout without card overlapping.
- When branching occurs (Condition or Split), branch them with Y offset: upper branch at Y = 50, lower branch at Y = 280.
- Connect edges carefully matching the node ids.
- All nodes must be draggable: true.`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage = errorData?.error?.message || response.statusText || "Chave de API inválida ou limite atingido.";
        throw new Error(`API: ${apiMessage}`);
      }

      const resData = await response.json();
      const resultText = resData.candidates[0].content.parts[0].text;
      
      const parsedFlow = JSON.parse(resultText.trim());
      
      if (parsedFlow.nodes && Array.isArray(parsedFlow.nodes)) {
        const formattedNodes = parsedFlow.nodes.map(n => ({
          ...n,
          draggable: true
        }));
        
        setNodes(formattedNodes);
        setEdges(parsedFlow.edges || []);
        
        toast.success("Fluxo completo gerado por IA com sucesso! 🚀", { id: loadingToastId });
        setIsGlobalAiOpen(false);
      } else {
        throw new Error("Formato de fluxo inválido retornado pela IA.");
      }

    } catch (error) {
      console.error(error);
      toast.error(`Falha ao gerar o fluxo: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsGlobalAiGenerating(false);
    }
  };

  const handleAiGenerate = () => {
    if (!selectedNode) return;
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      if (selectedNode.type === 'message') {
        const copy = `🔥 MENSAGEM GERADA POR IA ✨\n\nFala parceiro! Se liga nessa oportunidade única.\nIdentificamos que você tem interesse em escalar seus resultados com robôs de disparo.\n\nClique no botão abaixo para garantir sua vaga imediata com desconto especial! 🚀`;
        updateSelectedNode('content', copy);
      } else if (selectedNode.type === 'question') {
        const copy = `Qual é o seu principal objetivo hoje para escalar sua operação e aumentar faturamento? 📈`;
        updateSelectedNode('questionText', copy);
      } else if (selectedNode.type === 'email') {
        updateSelectedNode('subject', `✨ [IA] Desbloqueie sua máquina de vendas automáticas hoje!`);
        updateSelectedNode('body', `Olá {{lead_name}},\n\nNossa inteligência identificou que você está pronto para o próximo nível.\n\nAqui está o material de suporte exclusivo da MassFlow para te ajudar a estruturar sua automação.\n\nForte abraço!`);
      } else {
        alert("Configuração otimizada com IA com sucesso! 🎉");
      }
    }, 1200);
  };

  const saveToHistory = useCallback((currentNodes, currentEdges) => {
    setHistory((prev) => {
      const nextHistory = [...prev, { 
        nodes: JSON.parse(JSON.stringify(currentNodes)), 
        edges: JSON.parse(JSON.stringify(currentEdges)) 
      }];
      if (nextHistory.length > 30) {
        nextHistory.shift();
      }
      return nextHistory;
    });
  }, []);

  // Node draggable states dynamically toggled on double click!
  const onNodeDoubleClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          const isDraggable = !n.draggable;
          return { ...n, draggable: isDraggable };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleAddConnectedNode = useCallback((sourceId, sourceHandle, type) => {
    saveToHistory(nodes, edges);
    
    // Find the source node to position the new node next to it
    const sourceNode = nodes.find(n => n.id === sourceId);
    const sourcePos = sourceNode ? sourceNode.position : { x: 100, y: 150 };
    
    // Determine Y offset based on the handle row index to prevent overlap
    let yOffset = 0;
    if (sourceHandle.includes('source-')) {
      const idx = parseInt(sourceHandle.replace('cond-source-', ''));
      if (!isNaN(idx)) {
        yOffset = (idx) * 120;
      }
    } else if (sourceHandle === 'cond-source-else') {
      const conditionsLen = sourceNode?.data?.conditions?.length || 1;
      yOffset = (conditionsLen + 1) * 120;
    }

    const nextId = (nodes.length + 1).toString();
    const newPosition = {
      x: sourcePos.x + 350,
      y: sourcePos.y + yOffset
    };

    let newNode = { id: nextId, type, position: newPosition, data: { label: `Passo #${nextId}` }, draggable: true };

    if (type === 'message') {
      newNode.data = { 
        label: `Send Message #${nextId}`, 
        content: 'Escolha uma opção:\n1 - Conhecer planos\n2 - Falar com suporte', 
        buttons: [] 
      };
    } else if (type === 'question') {
      newNode.data = {
        label: `Question #${nextId}`,
        questionText: 'Qual é a sua dúvida?'
      };
    } else if (type === 'action') {
      newNode.data = { id: nextId, actionText: '[TELEGRAM] CLICOU ENTRAR NO GRUPO' };
    } else if (type === 'condition') {
      newNode.data = {
        label: `Condição #${nextId}`,
        conditions: [{ variable: 'Mensagem atual', operator: 'Contém', value: 'quero' }]
      };
    } else if (type === 'delay') {
      newNode.data = { time: '30 minutes' };
    } else if (type === 'split') {
      newNode.data = { label: 'Grupo A / Grupo B' };
    } else if (type === 'email') {
      newNode.data = {
        label: `Send Email #${nextId}`,
        subject: 'Enviar E-mail Comercial'
      };
    } else if (type === 'goto') {
      newNode.data = {
        label: `Ir para #${nextId}`
      };
    }

    // Create the edge connecting them from the specific condition sourceHandle to target
    const newEdge = {
      id: `e-${sourceId}-${nextId}-${sourceHandle}`,
      source: sourceId,
      target: nextId,
      sourceHandle: sourceHandle,
      targetHandle: 'left-target',
      animated: true,
      style: { stroke: '#5EFF00', strokeWidth: 2 }
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
    toast.success(`Etapa conectada criada com sucesso! 🎉`);
  }, [nodes, edges, saveToHistory, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      saveToHistory(nodes, edges);
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } }, eds));
    },
    [setEdges, nodes, edges, saveToHistory]
  );

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      saveToHistory(nodes, edges);
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges, nodes, edges, saveToHistory]
  );

  const nodeTypes = useMemo(() => ({
    message: MessageNode,
    question: QuestionNode,
    action: ActionNode,
    condition: (props) => <ConditionNode {...props} onAddConnectedNode={handleAddConnectedNode} />,
    split: SplitNode,
    email: EmailNode,
    goto: GoToNode,
    delay: DelayNode
  }), [handleAddConnectedNode]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setEditLabel(node.data.label || '');
    setEditNote(node.data.note || '');
    setEditContent(node.data.content || '');
    setEditButtons(node.data.buttons || []);
    setEditActionText(node.data.actionText || '');
    setEditTime(node.data.time || '');
    setEditQuestionText(node.data.questionText || '');
    setEditCondition(node.data.condition || '');
    setEditSubject(node.data.subject || '');
    setQuestionMode(null); // Reset sub-views
  };

  // Keyboard deletion, Undo (Ctrl+Z) and Copy-Paste (Ctrl+C, Ctrl+V) support
  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (isInput) return;

      // Ctrl+Z: Undo
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        setHistory((prev) => {
          if (prev.length === 0) return prev;
          const nextHistory = [...prev];
          const previousState = nextHistory.pop();
          setNodes(previousState.nodes);
          setEdges(previousState.edges);
          setSelectedNode(null);
          return nextHistory;
        });
        return;
      }

      // Ctrl+C: Copy
      if (event.ctrlKey && event.key === 'c') {
        const selected = nodes.find(n => n.selected) || selectedNode;
        if (selected) {
          event.preventDefault();
          setCopiedNode(selected);
        }
        return;
      }

      // Ctrl+V: Paste
      if (event.ctrlKey && event.key === 'v') {
        if (copiedNode) {
          event.preventDefault();
          saveToHistory(nodes, edges);
          
          const nextId = (nodes.length + 1).toString();
          const pastedNode = {
            ...JSON.parse(JSON.stringify(copiedNode)),
            id: nextId,
            selected: true,
            position: {
              x: copiedNode.position.x + 50,
              y: copiedNode.position.y + 50
            },
            data: {
              ...copiedNode.data,
              label: `${copiedNode.data.label || 'Cópia'} (Cópia)`
            }
          };

          setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(pastedNode));
          setSelectedNode(pastedNode);
        }
        return;
      }

      // Delete/Backspace: Exclude selected items
      if (event.key === 'Delete' || event.key === 'Backspace') {
        saveToHistory(nodes, edges);
        
        // Delete selected edges
        setEdges((eds) => eds.filter((e) => !e.selected));

        // Delete selected nodes
        setNodes((nds) => {
          const selectedNodeIds = nds.filter((n) => n.selected).map((n) => n.id);
          if (selectedNodeIds.length > 0) {
            // Remove connected edges as well
            setEdges((eds) => eds.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
            setSelectedNode(null);
            return nds.filter((n) => !n.selected);
          }
          // Fallback if no React Flow selection but a sidebar node is active
          if (selectedNode) {
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
            return nds.filter((n) => n.id !== selectedNode.id);
          }
          return nds;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, nodes, edges, copiedNode, setNodes, setEdges, saveToHistory]);

  const closeSidebar = () => {
    setSelectedNode(null);
  };

  const updateSelectedNode = (field, value) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedData = { ...node.data, [field]: value };
          return { ...node, data: updatedData };
        }
        return node;
      })
    );

    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, [field]: value } } : null);

    if (field === 'note') setEditNote(value);
    if (field === 'content') setEditContent(value);
    if (field === 'label') setEditLabel(value);
    if (field === 'actionText') setEditActionText(value);
    if (field === 'time') setEditTime(value);
    if (field === 'questionText') setEditQuestionText(value);
    if (field === 'condition') setEditCondition(value);
    if (field === 'subject') setEditSubject(value);
  };

  const handleAddQuestionField = (type) => {
    if (!selectedNode) return;
    const currentFields = selectedNode.data.fields || [];
    const defaultLabels = {
      text: 'Campo de Texto',
      email: 'E-mail do Usuário',
      url: 'Website/Link',
      phone: 'WhatsApp/Telefone',
      date: 'Data Solicitada'
    };
    const newField = { type, label: defaultLabels[type] || 'Novo Campo' };
    const updated = [...currentFields, newField];
    updateSelectedNode('fields', updated);
  };

  // Add / Edit / Remove actions for buttons inside node
  const handleAddButton = () => {
    const newBtn = { text: 'Escolha uma opção', link: 'https://exemplo.com' };
    const updated = [...editButtons, newBtn];
    setEditButtons(updated);
    updateSelectedNode('buttons', updated);
  };

  const handleEditButtonText = (index, newText) => {
    const updated = editButtons.map((btn, idx) => idx === index ? { ...btn, text: newText } : btn);
    setEditButtons(updated);
    updateSelectedNode('buttons', updated);
  };

  const handleRemoveButton = (index) => {
    const updated = editButtons.filter((_, idx) => idx !== index);
    setEditButtons(updated);
    updateSelectedNode('buttons', updated);
  };

  const handleAddConditionCase = () => {
    if (!selectedNode) return;
    const currentConds = selectedNode.data.conditions || [];
    const newCase = { variable: 'Mensagem atual', operator: 'Contém', value: 'quero' };
    const updated = [...currentConds, newCase];
    updateSelectedNode('conditions', updated);
  };

  const handleEditConditionCase = (index, field, newValue) => {
    if (!selectedNode) return;
    const currentConds = selectedNode.data.conditions || [];
    const updated = currentConds.map((cond, idx) => idx === index ? { ...cond, [field]: newValue } : cond);
    updateSelectedNode('conditions', updated);
  };

  const handleRemoveConditionCase = (index) => {
    if (!selectedNode) return;
    const currentConds = selectedNode.data.conditions || [];
    const updated = currentConds.filter((_, idx) => idx !== index);
    updateSelectedNode('conditions', updated);
  };

  const handleAddActionItem = (type, value = 'Lead_VIP') => {
    if (!selectedNode) return;
    const currentActions = selectedNode.data.actions || [];
    const newAct = { type, value };
    const updated = [...currentActions, newAct];
    updateSelectedNode('actions', updated);
  };

  const handleRemoveActionItem = (index) => {
    if (!selectedNode) return;
    const currentActions = selectedNode.data.actions || [];
    const updated = currentActions.filter((_, idx) => idx !== index);
    updateSelectedNode('actions', updated);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Right-Click Event opens the add step step modal exactly at mouse coordinates
  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setClickCoords({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setIsAddStepOpen(true);
  }, []);

  const addNewStep = (type) => {
    const id = (nodes.length + 1).toString();
    const position = screenToFlowPosition({
      x: clickCoords.x,
      y: clickCoords.y
    });

    let newNode = { id, type, position, data: { label: `Passo #${id}` }, draggable: true };

    if (type === 'message') {
      newNode.data = { 
        label: `Send Message #${id}`, 
        content: 'Escolha uma opção:\n1 - Conhecer planos\n2 - Falar com suporte', 
        buttons: [] 
      };
    } else if (type === 'question') {
      newNode.data = {
        label: `Question #${id}`,
        questionText: 'Qual é a sua dúvida?'
      };
    } else if (type === 'action') {
      newNode.data = { id, actionText: '[TELEGRAM] CLICOU ENTRAR NO GRUPO' };
    } else if (type === 'condition') {
      newNode.data = {
        label: `Condição #${id}`,
        condition: 'Se mensagem contém "quero"'
      };
    } else if (type === 'delay') {
      newNode.data = { time: '30 minutes' };
    } else if (type === 'split') {
      newNode.data = { label: 'Grupo A / Grupo B' };
    } else if (type === 'email') {
      newNode.data = {
        label: `Send Email #${id}`,
        subject: 'Enviar E-mail Comercial'
      };
    } else if (type === 'goto') {
      newNode.data = {
        label: `Ir para #${id}`
      };
    }

    setNodes((nds) => nds.concat(newNode));
    setIsAddStepOpen(false);
  };

  const handleSave = () => {
    toast.success('Automação publicada com sucesso! 🎉', {
      duration: 3000,
      style: {
        background: 'rgba(10, 16, 6, 0.97)',
        color: '#E5E5E5',
        border: '1px solid rgba(94, 255, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: '600',
        fontSize: '14px'
      },
      iconTheme: { primary: '#5EFF00', secondary: '#000' }
    });
  };

  return (
    <div className="page-container flow-editor-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem)', padding: '2rem 3rem', background: '#000000', color: '#E5E5E5', position: 'relative', overflow: 'hidden' }}>
      
      {/* CSS configurations: Solid whites, zoom functionality and visual styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Premium dark glassmorphic button configuration */
        .flow-editor-container button {
          background: rgba(18, 18, 18, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #9CA3AF !important;
          padding: 0.6rem 1.2rem !important;
          border-radius: 10px !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          transition: all 0.2s ease !important;
        }

        .flow-editor-container button:hover {
          background: rgba(26, 26, 26, 0.95) !important;
          border-color: rgba(94, 255, 0, 0.4) !important;
          color: #5EFF00 !important;
          transform: translateY(-1px) !important;
        }

        .flow-editor-container button.publish-btn {
          background: #5EFF00 !important;
          color: #000000 !important;
          border: 1px solid #5EFF00 !important;
          font-weight: 800 !important;
          box-shadow: 0 0 15px rgba(94, 255, 0, 0.3) !important;
        }

        .flow-editor-container button.publish-btn:hover {
          background: #4ec707 !important;
          border-color: #4ec707 !important;
          box-shadow: 0 0 20px rgba(94, 255, 0, 0.5) !important;
          color: #000000 !important;
        }

        /* Tools menu */
        .flow-editor-container .floating-tools-bar {
          background: rgba(10, 10, 10, 0.8) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
          padding: 8px 12px !important;
          display: flex !important;
          gap: 12px !important;
          align-items: center !important;
          margin-top: 10px !important;
        }

        .flow-editor-container .tool-icon-btn {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          padding: 6px !important;
          color: #9CA3AF !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .flow-editor-container .tool-icon-btn:hover {
          color: #5EFF00 !important;
        }

        /* 🛠️ PREMIUM 400px DARK SIDEBAR DRAWER */
        .flow-editor-container .node-edit-sidebar {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          width: 400px !important;
          height: 100% !important;
          background: rgba(10, 10, 10, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: -15px 0 40px rgba(0,0,0,0.7) !important;
          z-index: 100 !important;
          display: flex !important;
          flex-direction: column !important;
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* "Adicionar etapa" popup positioned at screen click coordinates */
        .flow-editor-container .add-step-overlay {
          position: fixed !important;
          width: 320px !important;
          background: rgba(15, 15, 15, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.7), 0 0 25px rgba(94, 255, 0, 0.05) !important;
          z-index: 200 !important;
          padding: 20px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          animation: scaleUp 0.15s ease-out both !important;
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .flow-editor-container .add-step-item {
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          padding: 10px 14px !important;
          border: 1px dashed rgba(255, 255, 255, 0.08) !important;
          border-radius: 10px !important;
          margin-bottom: 8px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          background: rgba(255,255,255,0.02) !important;
          color: #cbd5e1 !important;
        }

        .flow-editor-container .add-step-item:hover {
          border-color: #5EFF00 !important;
          background: rgba(94, 255, 0, 0.05) !important;
          color: #ffffff !important;
          transform: translateY(-1px) !important;
        }

        .flow-editor-container .step-icon-wrapper {
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .flow-editor-container .premium-dark-input {
          background: rgba(0, 0, 0, 0.5) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #fff !important;
          padding: 10px 12px !important;
          font-size: 0.85rem !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important;
          box-sizing: border-box !important;
          width: 100% !important;
          transition: all 0.2s !important;
        }

        .flow-editor-container .premium-dark-input:focus {
          border-color: rgba(94, 255, 0, 0.4) !important;
          background: rgba(10, 16, 6, 0.8) !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(94,255,0,0.15) !important;
          outline: none !important;
        }

        /* Custom MiniMap inside bottom left overlaying canvas */
        .flow-editor-container .react-flow__minimap {
          background: rgba(10, 10, 10, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          overflow: hidden !important;
          position: absolute !important;
          bottom: 20px !important;
          left: 20px !important;
          margin: 0 !important;
          z-index: 10 !important;
        }

        .flow-editor-container .react-flow__minimap-mask {
          fill: rgba(0, 0, 0, 0.55) !important;
        }

        /* Remove hand cursor from node cards on hover, keep standard arrow cursor */
        .flow-editor-container .react-flow__node {
          cursor: default !important;
        }

        /* Show drag/move cursor only when actively dragging nodes or node is draggable */
        .flow-editor-container .react-flow__node.dragging,
        .flow-editor-container .react-flow__node.draggable,
        .flow-editor-container .react-flow__node[data-draggable="true"] {
          cursor: move !important;
        }

        /* Prevent grab hand on pane background panning */
        .flow-editor-container .react-flow__pane {
          cursor: default !important;
        }
        .flow-editor-container .react-flow__pane:active {
          cursor: default !important;
        }

        /* drag connectors directly into the card to connect */
        .flow-editor-container .react-flow__connection-connecting .react-flow__handle.react-flow__handle-target {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          border-radius: 14px !important;
          background: rgba(94, 255, 0, 0.04) !important;
          border: 2px dashed rgba(94, 255, 0, 0.25) !important;
          box-shadow: 0 0 12px rgba(94, 255, 0, 0.12) !important;
          z-index: 9999 !important;
          opacity: 0.75 !important;
          transition: background 0.15s, border-color 0.15s !important;
        }

        .flow-editor-container .react-flow__connection-connecting .react-flow__handle.react-flow__handle-target:hover {
          background: rgba(94, 255, 0, 0.1) !important;
          border-color: #5EFF00 !important;
          box-shadow: 0 0 15px rgba(94, 255, 0, 0.3) !important;
        }

        /* Grid elements inside node editors */
        .flow-editor-container .dashed-grid-btn {
          border: 1px dashed rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          background: rgba(255,255,255,0.01) !important;
          color: #9CA3AF !important;
          padding: 8px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          position: relative !important;
        }

        .flow-editor-container .dashed-grid-btn:hover {
          border-color: #5EFF00 !important;
          color: #fff !important;
          background: rgba(94, 255, 0, 0.03) !important;
        }

        .flow-header-controls-container {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
        }
        
        .flow-header-left-col {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 16px !important;
        }

        .flow-header-inner-row {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 16px !important;
        }


        /* 📱 MOBILE RESPONSIVENESS AND TABLET BREAKPOINTS */
        @media (max-width: 768px) {
          .flow-editor-container {
            padding: 1rem !important;
            height: calc(100vh - 4.5rem) !important;
            flex-direction: column !important;
          }
          
          .flow-editor-container .node-edit-sidebar {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            border-left: none !important;
          }

          .flow-editor-container .add-step-overlay {
            width: calc(100% - 40px) !important;
            left: 20px !important;
            right: 20px !important;
            max-width: 360px !important;
            box-sizing: border-box !important;
          }

          .flow-editor-container .react-flow__minimap {
            display: none !important; /* Hide minimap on mobile to save precious viewport space */
          }
          
          .flow-editor-container button {
            padding: 0.5rem 0.8rem !important;
            font-size: 0.8rem !important;
          }

          .flow-header-controls-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 1rem !important;
            width: 100% !important;
          }

          .flow-header-left-col {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            width: 100% !important;
          }

          .flow-header-inner-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
            width: 100% !important;
          }

          .flow-header-inner-row > *,
          .flow-header-controls-container button {
            width: 100% !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          
          .floating-tools-bar {
            width: 100% !important;
            justify-content: space-around !important;
            margin-top: 0 !important;
            box-sizing: border-box !important;
          }

          .voltar-btn {
            width: 100% !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            background: rgba(255,255,255,0.02) !important;
            padding: 10px !important;
            border-radius: 8px !important;
          }
        }
      `}} />

      {/* ── Compact tool header — visible on all screens ── */}
      <div className="flow-header-controls-container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        flexShrink: 0
      }}>

        {/* Tool buttons group */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px', padding: '4px 6px'
        }}>
          {/* Add step */}
          <button
            onClick={() => setIsAddStepOpen(true)}
            className="tool-icon-btn"
            title="Adicionar Etapa"
            style={{ gap: '5px', padding: '5px 9px', borderRadius: '7px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Etapa</span>
          </button>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />

          {/* Zoom Out */}
          <button onClick={() => zoomOut()} className="tool-icon-btn" title="Diminuir Zoom" style={{ borderRadius: '7px', padding: '5px 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="5" y1="11" x2="17" y2="11"/></svg>
          </button>

          {/* Zoom In */}
          <button onClick={() => zoomIn()} className="tool-icon-btn" title="Aumentar Zoom" style={{ borderRadius: '7px', padding: '5px 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="11" y1="7" x2="11" y2="15"/><line x1="7" y1="11" x2="15" y2="11"/></svg>
          </button>

          {/* Fit View */}
          <button onClick={() => fitView({ maxZoom: 1, duration: 400 })} className="tool-icon-btn" title="Encaixar Tela" style={{ borderRadius: '7px', padding: '5px 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          flex: 1, maxWidth: '220px', display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px', padding: '3px 8px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Buscar nó..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#E5E5E5', fontSize: '11.5px', fontWeight: '600',
              fontFamily: 'Outfit, sans-serif', width: '100%'
            }}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Gerar com IA */}
        <button 
          onClick={() => {
            toast.error("Gerador por IA em desenvolvimento! 🚀", {
              duration: 3000,
              style: {
                background: 'rgba(20, 20, 20, 0.95)',
                color: '#cbd5e1',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '700'
              }
            });
          }}
          className="tool-icon-btn" 
          title="Criar Fluxo Inteligente com IA" 
          style={{ 
            gap: '6px', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: '800',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          <span style={{ fontSize: '12px' }}>✨</span> Gerar com IA
        </button>

        {/* Publish */}
        <button onClick={handleSave} className="publish-btn" style={{ padding: '0.45rem 1.3rem', borderRadius: '8px', fontSize: '12px' }}>
          Publicar
        </button>
      </div>

      {/* Editor Canvas Container */}
      <div style={{
        flex: 1,
        background: '#161824',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.5)'
      }}>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneContextMenu={onPaneContextMenu}
          onPaneClick={() => setIsAddStepOpen(false)}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
          preventScrolling={false}
          zoomOnPinch={true}
          panOnDrag={true}
          style={{ width: '100%', height: '100%' }}
        >
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'message') return '#cbd5e1';
              if (n.type === 'question') return '#2563eb';
              if (n.type === 'action') return '#f59e0b';
              if (n.type === 'condition') return '#0d9488';
              if (n.type === 'split') return '#a855f7';
              if (n.type === 'email') return '#db2777';
              if (n.type === 'goto') return '#db2777';
              if (n.type === 'delay') return '#f59e0b';
              return '#64748b';
            }}
            position="bottom-left"
          />
          <Background variant="dots" color="rgba(255, 255, 255, 0.22)" gap={20} size={1.5} />
        </ReactFlow>

        {/* 🛠️ STEP SELECTOR OVERLAY (Screenshot 2 popup - Click coordinates) */}
        {isAddStepOpen && (
          <div 
            className="add-step-overlay"
            style={{ 
              top: clickCoords.y, 
              left: clickCoords.x,
              position: 'absolute' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>Adicionar etapa</span>
              <button 
                onClick={() => setIsAddStepOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', padding: '4px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>

            <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* Mensagem */}
              <div className="add-step-item" onClick={() => addNewStep('message')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Mensagem</div>
              </div>

              {/* Pergunta */}
              <div className="add-step-item" onClick={() => addNewStep('question')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Pergunta</div>
              </div>

              {/* Ação */}
              <div className="add-step-item" onClick={() => addNewStep('action')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Ação</div>
              </div>

              {/* Condição */}
              <div className="add-step-item" onClick={() => addNewStep('condition')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Condição</div>
              </div>

              {/* Dividir Teste A/B */}
              <div className="add-step-item" onClick={() => addNewStep('split')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M12 2v20M2 18l10 4 10-4"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Dividir (Teste A/B)</div>
              </div>

              {/* E-mail */}
              <div className="add-step-item" onClick={() => addNewStep('email')} style={{ position: 'relative' }}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(219, 39, 119, 0.15)', color: '#f472b6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>E-mail</div>
              </div>

              {/* Ir Para */}
              <div className="add-step-item" onClick={() => addNewStep('goto')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8h6v6"/><path d="M24 8L14 18l-6-6-8 8"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Ir para</div>
              </div>

               {/* Atraso */}
              <div className="add-step-item" onClick={() => addNewStep('delay')}>
                <div className="step-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700' }}>Atraso Inteligente</div>
              </div>

            </div>

            {/* Etapas existentes section matching Screenshot 1 */}
            {nodes.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '14px', paddingTop: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Etapas existentes</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {nodes.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        onNodeClick(null, n);
                        setIsAddStepOpen(false);
                      }}
                      className="add-step-item"
                      style={{ padding: '8px 12px !important', margin: 0 }}
                    >
                      <div style={{ fontSize: '11.5px', fontWeight: '700' }}>
                        [{n.type.toUpperCase()}] {n.data.label || `Passo #${n.id}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 🛠️ SIDEBAR EDIT PANEL (height: 100%, width: 400px - Screenshot 3, 4, 5) */}
        {selectedNode && (
          <div className="node-edit-sidebar">
            
            {/* Sidebar Tab Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,20,20,0.5)', height: '48px', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', flex: 1 }}>
                {['Editar', 'Gerar por IA ✨', 'Guia'].map((tab) => {
                  const tabKey = tab.replace(' ✨', '');
                  const isActive = activeTab === tabKey || (tab === 'Gerar por IA ✨' && activeTab === 'IA');
                  const tabId = tab === 'Gerar por IA ✨' ? 'IA' : tab;
                  return (
                    <span
                      key={tab}
                      onClick={() => setActiveTab(tabId)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: isActive ? '#5EFF00' : '#64748b',
                        borderBottom: isActive ? '2.5px solid #5EFF00' : '2.5px solid transparent',
                        padding: '14px 4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'color 0.2s, border-color 0.2s'
                      }}
                    >
                      {tab}
                    </span>
                  );
                })}
              </div>
              <button 
                onClick={closeSidebar}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                &times;
              </button>
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {activeTab === 'Editar' ? (
                <>
                  {/* Node Header Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedNode.type === 'email' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      ) : selectedNode.type === 'question' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E5E5E5" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        className="premium-dark-input"
                        value={editLabel} 
                        onChange={(e) => updateSelectedNode('label', e.target.value)}
                        style={{ border: 'none', fontSize: '13px', fontWeight: '800', color: '#ffffff', width: '100%', padding: 0, background: 'transparent', boxShadow: 'none' }}
                      />
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Identificação do Bloco</div>
                    </div>
                  </div>

                  {/* Dark-Gold Note area */}
                  <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" style={{ marginTop: '2px' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <textarea 
                      placeholder="adicionar nota ..."
                      value={editNote}
                      onChange={(e) => updateSelectedNode('note', e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        width: '100%',
                        resize: 'none',
                        minHeight: '40px',
                        outline: 'none',
                        padding: 0
                      }}
                    />
                  </div>

                  {/* 📧 1. SEND EMAIL EDITOR FORM */}
                  {selectedNode.type === 'email' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Perfil de E-mail</label>
                        <select 
                          value={selectedNode.data.emailProfile || ''} 
                          onChange={(e) => updateSelectedNode('emailProfile', e.target.value)}
                          className="premium-dark-input"
                        >
                          <option value="">Selecione o remetente conectado...</option>
                          <option value="suporte@suaempresa.com">suporte@suaempresa.com</option>
                          <option value="comercial@suaempresa.com">comercial@suaempresa.com</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Destinatário</label>
                        <input 
                          type="text" 
                          className="premium-dark-input"
                          value={selectedNode.data.recipient || ''} 
                          onChange={(e) => updateSelectedNode('recipient', e.target.value)}
                          placeholder="ex: {{lead_email}}"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Modelo de e-mail</label>
                        <select 
                          value={selectedNode.data.emailTemplate || '==No Template=='} 
                          onChange={(e) => updateSelectedNode('emailTemplate', e.target.value)}
                          className="premium-dark-input"
                        >
                          <option value="==No Template==">==No Template==</option>
                          <option value="boas-vindas">E-mail de Boas-vindas</option>
                          <option value="script-vip">Envio do Script VIP</option>
                        </select>
                      </div>

                      {(selectedNode.data.emailTemplate === '==No Template==' || !selectedNode.data.emailTemplate) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Assunto do E-mail</label>
                            <input 
                              type="text" 
                              className="premium-dark-input"
                              value={selectedNode.data.subject || ''} 
                              onChange={(e) => updateSelectedNode('subject', e.target.value)}
                              placeholder="Assunto"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Corpo do Texto (Markdown/HTML)</label>
                            <textarea 
                              className="premium-dark-input"
                              value={selectedNode.data.body || ''} 
                              onChange={(e) => updateSelectedNode('body', e.target.value)}
                              placeholder="Corpo do texto..."
                              style={{ minHeight: '100px', lineHeight: '1.4' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ❓ 2. QUESTION EDITOR FORM (Screenshot 2 / 3 / 4 / 5) */}
                  {selectedNode.type === 'question' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Texto da Pergunta:</label>
                        <textarea 
                          className="premium-dark-input"
                          value={editQuestionText}
                          onChange={(e) => updateSelectedNode('questionText', e.target.value)}
                          placeholder="Insira uma pergunta..."
                          style={{ width: '100%', minHeight: '60px', lineHeight: '1.4' }}
                        />
                      </div>

                      {/* Display Active Fields List */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Campos de Resposta:</label>
                        {selectedNode.data.fields && selectedNode.data.fields.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            {selectedNode.data.fields.map((field, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#5EFF00', textTransform: 'uppercase' }}>{field.type}</span>
                                <input 
                                  type="text" 
                                  className="premium-dark-input"
                                  value={field.label} 
                                  onChange={(e) => {
                                    const updated = selectedNode.data.fields.map((f, i) => i === idx ? { ...f, label: e.target.value } : f);
                                    updateSelectedNode('fields', updated);
                                  }}
                                  style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: '700', color: '#ffffff', flex: 1, padding: 0, boxShadow: 'none' }}
                                />
                                <button 
                                  onClick={() => {
                                    const updated = selectedNode.data.fields.filter((_, i) => i !== idx);
                                    updateSelectedNode('fields', updated);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '2px', cursor: 'pointer', fontSize: '14px', boxShadow: 'none' }}
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                            Nenhum campo de resposta criado ainda
                          </div>
                        )}

                        {/* Column stack of Question Options to Add Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div className="dashed-grid-btn" onClick={() => handleAddQuestionField('text')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            + Texto
                          </div>
                          <div className="dashed-grid-btn" onClick={() => handleAddQuestionField('email')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            + E-mail
                          </div>
                          <div className="dashed-grid-btn" onClick={() => handleAddQuestionField('url')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            + url
                          </div>
                          <div className="dashed-grid-btn" onClick={() => handleAddQuestionField('phone')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            + Telefone
                          </div>
                          <div className="dashed-grid-btn" onClick={() => handleAddQuestionField('date')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            + Data
                          </div>
                        </div>
                      </div>

                      {/* Advanced Settings */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                        <div 
                          onClick={() => setAdvancedOpen(!advancedOpen)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: '800', color: '#E5E5E5' }}
                        >
                          <span>Configurações avançadas</span>
                          <span>{advancedOpen ? '▼' : '►'}</span>
                        </div>
                        {advancedOpen && (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '10px', color: '#9CA3AF' }}>Tempo para agrupar</label>
                            <select className="premium-dark-input"><option>Nenhum</option></select>
                            <input type="text" className="premium-dark-input" placeholder="adicionar Cabeçalho" />
                            <input type="text" className="premium-dark-input" placeholder="adicionar Footer" />
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Form specific to Message Node */}
                  {selectedNode.type === 'message' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Conteúdo da Mensagem:</label>
                        <textarea 
                          className="premium-dark-input"
                          value={editContent}
                          onChange={(e) => updateSelectedNode('content', e.target.value)}
                          placeholder="Escolha uma mensagem: Conhecer..."
                          style={{ width: '100%', minHeight: '120px', lineHeight: '1.4' }}
                        />
                      </div>

                      {/* Interactive Buttons List */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Botões de Ação:</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {editButtons.map((btn, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              <input 
                                type="text" 
                                className="premium-dark-input"
                                value={btn.text} 
                                onChange={(e) => handleEditButtonText(idx, e.target.value)}
                                style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: '700', color: '#ffffff', flex: 1, padding: 0, boxShadow: 'none' }}
                              />
                              <button 
                                onClick={() => handleRemoveButton(idx)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '2px', cursor: 'pointer', fontSize: '14px', boxShadow: 'none' }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <div 
                            onClick={handleAddButton}
                            style={{ border: '2px dashed rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5EFF00'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                          >
                            + Adicionar botão
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form specific to Action Node */}
                  {selectedNode.type === 'action' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Active Actions List */}
                      {selectedNode.data.actions && selectedNode.data.actions.length > 0 && (
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Itens de Ação Configurados:</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {selectedNode.data.actions.map((act, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  {act.type === 'tag_add' ? `Adicionar tag: ${act.value}` : act.type === 'tag_remove' ? `Remover tag: ${act.value}` : act.value}
                                </div>
                                <button 
                                  onClick={() => handleRemoveActionItem(idx)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: 0, boxShadow: 'none' }}
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '12px', color: '#b45309', fontSize: '12px', lineHeight: '1.4' }}>
                        Use os botões abaixo para adicionar item de ação.
                      </div>

                      {/* Column stack of Action Categories */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="dashed-grid-btn" onClick={() => {
                          const actionName = prompt("Insira o nome da tag a ser adicionada:", "Lead_VIP");
                          if (actionName) handleAddActionItem('tag_add', actionName);
                        }} style={{ padding: '12px 10px !important' }}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          Ações básicas
                        </div>
                        <div className="dashed-grid-btn" onClick={() => handleAddActionItem('webhook', 'Disparar Webhook')}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          Ações Avançadas
                        </div>
                        <div className="dashed-grid-btn" onClick={() => handleAddActionItem('crm_sync', 'Sincronizar CRM')}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          Integrações
                        </div>
                        <div className="dashed-grid-btn" onClick={() => handleAddActionItem('notify', 'Notificar Suporte')}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          Notificação
                        </div>
                        <div className="dashed-grid-btn" onClick={() => handleAddActionItem('ecommerce', 'Criar Checkout')}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          E-commerce
                        </div>
                        <div className="dashed-grid-btn" onClick={() => handleAddActionItem('ai_prompt', 'Processar com IA')}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>⇅</span>
                          Ações de IA
                        </div>
                      </div>

                      {/* Floating dropdown options reference matching Screenshot 4 */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Atalhos de Ação Básica:</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {['Adicionar tag', 'Remover tag', 'Definir valor da variável', 'Operação JSON'].map((actionText) => (
                            <button 
                              key={actionText}
                              onClick={() => {
                                if (actionText.includes('tag')) {
                                  const name = prompt(`Insira o valor para ${actionText}:`, "Lead_VIP");
                                  if (name) handleAddActionItem(actionText.includes('Adicionar') ? 'tag_add' : 'tag_remove', name);
                                } else {
                                  handleAddActionItem('custom_action', actionText);
                                }
                              }}
                              style={{ padding: '8px 12px !important', fontSize: '11px !important', background: 'rgba(255,255,255,0.03) !important', borderColor: 'rgba(255,255,255,0.08) !important', color: '#cbd5e1 !important', width: '100%' }}
                            >
                              + {actionText}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Form specific to Condition Node */}
                  {selectedNode.type === 'condition' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Active Conditions List */}
                      {selectedNode.data.conditions && selectedNode.data.conditions.length > 0 && (
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Condições de Bifurcação:</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedNode.data.conditions.map((cond, idx) => (
                              <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#0d9488' }}>CASO #{idx + 1}</span>
                                  <button 
                                    onClick={() => handleRemoveConditionCase(idx)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0, boxShadow: 'none' }}
                                  >
                                    &times;
                                  </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Origem da variável</label>
                                    <select 
                                      value={cond.variable || 'Mensagem atual'} 
                                      onChange={(e) => handleEditConditionCase(idx, 'variable', e.target.value)}
                                      className="premium-dark-input"
                                    >
                                      <option value="Mensagem atual">Mensagem atual</option>
                                      <option value="Lead VIP">Lead VIP</option>
                                      <option value="Cidade">Cidade</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Critério lógico</label>
                                    <select 
                                      value={cond.operator || 'Contém'} 
                                      onChange={(e) => handleEditConditionCase(idx, 'operator', e.target.value)}
                                      className="premium-dark-input"
                                    >
                                      <option value="Igual a">Igual a</option>
                                      <option value="Contém">Contém</option>
                                      <option value="Existe">Existe</option>
                                      <option value="Maior que">Maior que</option>
                                      <option value="Começa com">Começa com</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Valor Comparativo</label>
                                    <input 
                                      type="text" 
                                      className="premium-dark-input"
                                      value={cond.value || ''} 
                                      onChange={(e) => {
                                        handleEditConditionCase(idx, 'value', e.target.value);
                                        // Also sync condition display text in card
                                        const variable = cond.variable || 'Mensagem atual';
                                        const operator = cond.operator || 'Contém';
                                        const val = e.target.value;
                                      }}
                                      placeholder='Ex: "quero"'
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Group button */}
                      <div 
                        onClick={handleAddConditionCase}
                        style={{ border: '2px dashed rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5EFF00'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                      >
                        + Adicionar caso de condição
                      </div>

                      {/* Else case */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block' }}>Caso contrário (Else)</label>
                        <div style={{ border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px', fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>
                          Direciona para a parte inferior/saída secundária se nenhuma condição bater.
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Form specific to Delay Node */}
                  {selectedNode.type === 'delay' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Duração</label>
                          <input 
                            type="number" 
                            className="premium-dark-input"
                            value={selectedNode.data.amount || '30'}
                            onChange={(e) => {
                              const amount = e.target.value || '30';
                              const unit = selectedNode.data.unit || 'minutos';
                              updateSelectedNode('amount', amount);
                              updateSelectedNode('time', `${amount} ${unit}`);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Unidade</label>
                          <select 
                            className="premium-dark-input" 
                            value={selectedNode.data.unit || 'minutos'}
                            onChange={(e) => {
                              const unit = e.target.value;
                              const amount = selectedNode.data.amount || '30';
                              updateSelectedNode('unit', unit);
                              updateSelectedNode('time', `${amount} ${unit}`);
                            }}
                          >
                            <option value="minutos">Minutos</option>
                            <option value="horas">Horas</option>
                            <option value="dias">Dias</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <input 
                          type="checkbox" 
                          id="businessHours"
                          checked={!!selectedNode.data.businessHoursOnly}
                          onChange={(e) => updateSelectedNode('businessHoursOnly', e.target.checked)}
                          style={{ accentColor: '#5EFF00', width: '16px', height: '16px' }}
                        />
                        <label htmlFor="businessHours" style={{ fontSize: '12px', fontWeight: '800', color: '#E5E5E5', cursor: 'pointer' }}>
                          Apenas em horário comercial
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Form specific to Split Node */}
                  {selectedNode.type === 'split' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                      {/* Labels editáveis dos grupos */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#a855f7', display: 'block', marginBottom: '6px' }}>Nome do Grupo A</label>
                          <input
                            type="text"
                            className="premium-dark-input"
                            value={selectedNode.data.labelA || 'Grupo A'}
                            onChange={(e) => updateSelectedNode('labelA', e.target.value)}
                            placeholder="Ex: Oferta Direta"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#ec4899', display: 'block', marginBottom: '6px' }}>Nome do Grupo B</label>
                          <input
                            type="text"
                            className="premium-dark-input"
                            value={selectedNode.data.labelB || 'Grupo B'}
                            onChange={(e) => updateSelectedNode('labelB', e.target.value)}
                            placeholder="Ex: Oferta com Bônus"
                          />
                        </div>
                      </div>

                      {/* Slider de porcentagem */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Divisão de tráfego</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={selectedNode.data.splitPercent ?? 50} 
                            style={{ flex: 1, accentColor: '#5EFF00' }}
                            onChange={(e) => updateSelectedNode('splitPercent', parseInt(e.target.value))}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#5EFF00', width: '42px' }}>
                            {selectedNode.data.splitPercent ?? 50}%
                          </span>
                        </div>
                      </div>

                      {/* Preview visual da divisão */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                          flex: selectedNode.data.splitPercent ?? 50,
                          background: 'rgba(168,85,247,0.15)',
                          border: '1px solid rgba(168,85,247,0.3)',
                          borderRadius: '8px',
                          padding: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#a855f7' }}>{selectedNode.data.labelA || 'Grupo A'}</div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#a855f7' }}>{selectedNode.data.splitPercent ?? 50}%</div>
                        </div>
                        <div style={{
                          flex: 100 - (selectedNode.data.splitPercent ?? 50),
                          background: 'rgba(236,72,153,0.15)',
                          border: '1px solid rgba(236,72,153,0.3)',
                          borderRadius: '8px',
                          padding: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#ec4899' }}>{selectedNode.data.labelB || 'Grupo B'}</div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#ec4899' }}>{100 - (selectedNode.data.splitPercent ?? 50)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form specific to GoTo Node */}
                  {selectedNode.type === 'goto' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Direcionar Funil Para</label>
                        <select 
                          className="premium-dark-input"
                          value={selectedNode.data.targetNodeId || ''}
                          onChange={(e) => {
                            const targetId = e.target.value;
                            updateSelectedNode('targetNodeId', targetId);
                            // Remove any existing outgoing edge from this goto node
                            // then add a new one if a target was selected
                            setEdges(eds => {
                              const filtered = eds.filter(edge => edge.source !== selectedNode.id);
                              if (!targetId) return filtered;
                              return [...filtered, {
                                id: `e-goto-${selectedNode.id}-${targetId}`,
                                source: selectedNode.id,
                                target: targetId,
                                sourceHandle: 'right-source',
                                targetHandle: 'left-target',
                                animated: true,
                                style: { stroke: '#db2777', strokeWidth: 2, strokeDasharray: '6 3' },
                                label: '↩ Ir para',
                                labelStyle: { fill: '#f472b6', fontWeight: 700, fontSize: 10 },
                                labelBgStyle: { fill: 'rgba(0,0,0,0.8)', borderRadius: 4 },
                                labelBgPadding: [4, 6]
                              }];
                            });
                          }}
                        >
                          <option value="">Selecione a etapa de destino...</option>
                          {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                            <option key={n.id} value={n.id}>
                              [{n.type.toUpperCase()}] Passo #{n.id} ({n.data.label || n.data.subject || n.data.questionText || 'Sem título'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedNode.data.targetNodeId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(219,39,119,0.08)', border: '1px solid rgba(219,39,119,0.25)', borderRadius: '8px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2.5"><path d="M18 8h6v6"/><path d="M24 8L14 18l-6-6-8 8"/></svg>
                          <span style={{ fontSize: '11.5px', color: '#f472b6', fontWeight: '700' }}>
                            Conectado → Passo #{selectedNode.data.targetNodeId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                </>
              ) : activeTab === 'IA' ? (
                <div style={{ fontSize: '13px', color: '#E5E5E5', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(94, 255, 0, 0.04)', border: '1px solid rgba(94, 255, 0, 0.2)', borderRadius: '12px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>✨</span>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '850', color: '#5EFF00', margin: '0 0 4px 0' }}>Assistente de IA MassFlow</h4>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#9CA3AF' }}>Otimize ou gere copies de alta conversão para essa etapa automaticamente utilizando nossa IA.</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>O que você deseja que a IA escreva?</label>
                    <textarea 
                      className="premium-dark-input"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ex: Crie uma copy persuasiva de conversão para público frio..."
                      style={{ width: '100%', minHeight: '80px', lineHeight: '1.4' }}
                    />
                  </div>

                  {/* Suggestion tags */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px' }}>Sugestões rápidas:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Copy Emocional 💡', 'Urgência Máxima ⏳', 'Tom Amigável 😊', 'Resolver Objeção 🛡️'].map(tag => (
                        <div 
                          key={tag}
                          onClick={() => setAiPrompt(`Escreva com o estilo: ${tag}`)}
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 12px', fontSize: '11px', fontWeight: '750', color: '#cbd5e1', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5EFF00'; e.currentTarget.style.color = '#5EFF00'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating}
                    style={{ 
                      width: '100%', 
                      background: '#5EFF00 !important', 
                      color: '#000000 !important', 
                      fontWeight: '800 !important',
                      opacity: isAiGenerating ? 0.7 : 1,
                      pointerEvents: isAiGenerating ? 'none' : 'auto',
                      boxShadow: '0 0 15px rgba(94, 255, 0, 0.2) !important'
                    }}
                  >
                    {isAiGenerating ? 'IA escrevendo...' : 'Gerar com IA ✨'}
                  </button>

                  {isAiGenerating && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(94,255,0,0.2)', borderTopColor: '#5EFF00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600' }}>Pensando e redigindo copy perfeita...</span>
                      <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}} />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6' }}>
                  <h3 style={{ fontSize: '15px', color: '#ffffff', margin: '0 0 10px 0' }}>Guia de Automação de Canais</h3>
                  <p>Este bloco permite configurar o envio automático de mensagens interativas e a sincronização de tags com a sua corretora e canais oficiais.</p>
                  <ul style={{ paddingLeft: '18px', margin: '10px 0' }}>
                    <li style={{ marginBottom: '6px' }}>Configure <strong>botões</strong> com links personalizados de indicação (referrals).</li>
                    <li style={{ marginBottom: '6px' }}>Escreva <strong>notas internas</strong> para organizar a lógica da sua equipe de funil.</li>
                    <li style={{ marginBottom: '6px' }}>Conecte as saídas aos gatilhos subsequentes de atraso e ação.</li>
                  </ul>
                  <p style={{ marginTop: '10px' }}>Qualquer dúvida, fale com nosso suporte MassFlow!</p>
                </div>
              )}
            </div>

            {/* Delete button footer matching user request "deve dar para tirar o card" */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.8)', display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button 
                onClick={deleteSelectedNode}
                style={{ width: '100%', background: 'rgba(239, 68, 68, 0.15) !important', borderColor: 'rgba(239, 68, 68, 0.3) !important', color: '#f87171 !important' }}
              >
                Excluir Etapa
              </button>
            </div>

          </div>
        )}

        {/* 🛠️ GLOBAL AI FLOW GENERATOR SIDEBAR */}
        {isGlobalAiOpen && (
          <div className="node-edit-sidebar">
            {/* Sidebar Tab Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,20,20,0.5)', height: '48px', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#5EFF00' }}>
                Gerador de Fluxos por IA ✨
              </span>
              <button 
                onClick={() => setIsGlobalAiOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                &times;
              </button>
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '12px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>🔮</span>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '850', color: '#a78bfa', margin: '0 0 4px 0' }}>Criação de Funil Completo</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', lineHeight: '1.4' }}>
                    Descreva o fluxo desejado em linguagem natural e a inteligência irá estruturar todos os cards, textos e conexões de forma perfeita no canvas!
                  </p>
                </div>
              </div>

              {/* API Key Input Fallback if VITE_GEMINI_API_KEY is not loaded */}
              {!import.meta.env.VITE_GEMINI_API_KEY && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', display: 'block', marginBottom: '6px' }}>
                    ⚠️ Chave da API do Gemini (.env não configurada)
                  </label>
                  <input
                    type="password"
                    placeholder="Insira sua API Key AI Studio..."
                    className="premium-dark-input"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    style={{ fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Sua chave é salva apenas temporariamente na memória local para testes.
                  </span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Descreva seu fluxo completo:</label>
                <textarea 
                  className="premium-dark-input"
                  value={globalAiPrompt}
                  onChange={(e) => setGlobalAiPrompt(e.target.value)}
                  placeholder="Ex: Crie um fluxo do WhatsApp de 4 passos. 1: Mensagem dando as boas-vindas com botão 'Sim'. 2: Pergunta pedindo o e-mail dele. 3: Atraso inteligente de 10 minutos. 4: E-mail com script VIP em anexo..."
                  style={{ width: '100%', minHeight: '130px', lineHeight: '1.4', fontSize: '12px' }}
                />
              </div>

              {/* Suggestions */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px' }}>Modelos sugeridos:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: "Funil de Boas-vindas + Captura 📥", desc: "Mensagem de início, pergunta e-mail, adiciona tag, atraso 5 min, envia e-mail comercial" },
                    { label: "Qualificação de Leads A/B 🎯", desc: "Pergunta se quer desconto, divide tráfego 50/50, envia Grupo A com cupom e Grupo B com frete grátis" },
                    { label: "Condições de Suporte Automatizado 💬", desc: "Mensagem inicial, condição se mensagem contém 'suporte' ou 'vendas', e redireciona adequadamente" }
                  ].map(item => (
                    <div 
                      key={item.label}
                      onClick={() => setGlobalAiPrompt(item.desc)}
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        borderRadius: '8px', 
                        padding: '8px 10px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1' }}>{item.label}</div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.8)', display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button 
                onClick={handleGlobalAiGenerate}
                disabled={isGlobalAiGenerating}
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5) !important', 
                  color: '#ffffff !important', 
                  fontWeight: '800 !important',
                  opacity: isGlobalAiGenerating ? 0.7 : 1,
                  pointerEvents: isGlobalAiGenerating ? 'none' : 'auto',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4) !important',
                  border: 'none !important',
                  padding: '12px !important',
                  borderRadius: '10px !important'
                }}
              >
                {isGlobalAiGenerating ? 'IA Estruturando Funil...' : 'Criar Fluxo Completo ✨'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Wrap FlowEditor content in Provider to expose Screen Coordinates helper screenToFlowPosition
export default function FlowEditor({ token, setIsSidebarOpen }) {
  return (
    <ReactFlowProvider>
      <FlowEditorContent token={token} setIsSidebarOpen={setIsSidebarOpen} />
    </ReactFlowProvider>
  );
}

// ── DATA TEMPLATES FOR PLATFORMS (RICH HORIZONTAL FLOWS WITH MORE THAN 10 STEPS EACH) ──────

// ── DATA TEMPLATES FOR PLATFORMS (RICH HORIZONTAL FLOWS WITH MORE THAN 10 STEPS EACH) ──────

const initialNodesByPlatform = {
  tiktok: [
    { id: '1', type: 'message', position: { x: 100, y: 150 }, data: { label: 'TikTok Início #1Boas-vindas', content: 'Fala parceiro! Se liga nessa oportunidade única. 🚀\nIdentificamos que você tem interesse em escalar seus resultados com robôs de disparo e automação.\n\nQuer ter acesso imediato ao nosso Script VIP de Vendas Completo 100% grátis?', buttons: [{ text: 'Quero Acesso VIP' }, { text: 'Quero Saber Mais' }] }, draggable: true },
    { id: '2', type: 'question', position: { x: 450, y: 150 }, data: { label: 'Nome Lead #2', questionText: 'Excelente escolha! Para personalizar seu atendimento, qual é o seu primeiro nome?' }, draggable: true },
    { id: '3', type: 'question', position: { x: 800, y: 150 }, data: { label: 'Email Corporativo #3', questionText: 'Obrigado! E qual é o seu melhor e-mail profissional para enviarmos o material de suporte VIP?', fields: [{ type: 'email', label: 'E-mail profissional' }] }, draggable: true },
    { id: '4', type: 'action', position: { x: 1150, y: 150 }, data: { label: 'Tag Origem TikTok #4', actions: [{ type: 'tag_add', value: 'TikTok_Lead_Frio' }, { type: 'tag_add', value: 'Aguardando_Aprovacao' }] }, draggable: true },
    { id: '5', type: 'split', position: { x: 1500, y: 150 }, data: { label: 'Divisor Teste A/B #5', splitPercent: 50, labelA: 'Copy Emocional (A)', labelB: 'Copy Técnica (B)' }, draggable: true },
    { id: '6', type: 'message', position: { x: 1850, y: 50 }, data: { label: 'Oferta Emocional A #6', content: 'Parabéns! Você acaba de garantir 50% de desconto imediato. 🎉\n\nEssa é a sua chance de mudar de vida, automatizar sua operação inteira e finalmente ter a liberdade geográfica e de tempo que sempre sonhou!', buttons: [{ text: 'Garantir Vaga 50%' }] }, draggable: true },
    { id: '7', type: 'message', position: { x: 1850, y: 280 }, data: { label: 'Oferta Técnica B #7', content: 'Parabéns! Liberamos o Frete Grátis e um Super Bônus de Integração API VIP. ⚙️\n\nAcelere suas integrações em menos de 5 minutos com nossa documentação robusta, webhooks ilimitados e estabilidade garantida de 99.9% uptime!', buttons: [{ text: 'Garantir Bônus VIP' }] }, draggable: true },
    { id: '8', type: 'delay', position: { x: 2200, y: 150 }, data: { label: 'Atraso Inteligente #8', time: '10 minutos' }, draggable: true },
    { id: '9', type: 'condition', position: { x: 2550, y: 150 }, data: { label: 'Validador Nível Lead #9', conditions: [{ value: 'Nicho é marketing' }] }, draggable: true },
    { id: '10', type: 'email', position: { x: 2900, y: 50 }, data: { label: 'Script VIP Comercial #10', subject: '✨ Aqui está seu Script VIP de Vendas PDF Completo!', body: 'Olá {{lead_name}},\n\nComo prometido no TikTok, aqui está o seu Script VIP completo para turbinar suas conversões nas primeiras 24 horas!\n\nUse com moderação.' }, draggable: true },
    { id: '11', type: 'message', position: { x: 2900, y: 280 }, data: { label: 'WhatsApp Redirecionamento #11', content: 'Notamos que seu nicho não é marketing direto. Quer falar com nosso gerente comercial para adaptarmos a ferramenta?', buttons: [{ text: 'Chamar Gerente' }] }, draggable: true },
    { id: '12', type: 'goto', position: { x: 3250, y: 150 }, data: { label: 'Loop Central #12', targetNodeId: '1' }, draggable: true }
  ],
  instagram: [
    { id: '1', type: 'message', position: { x: 100, y: 150 }, data: { label: 'Mensagem Direct Reels #1', content: 'Que show que você curtiu nosso Reels! 📸\n\nPreparamos um funil de conversão automático incrível. Digite seu principal segmento abaixo para podermos te dar a recomendação perfeita:', buttons: [{ text: 'Marketing de Afiliados' }, { text: 'E-commerce / Drop' }] }, draggable: true },
    { id: '2', type: 'question', position: { x: 450, y: 150 }, data: { label: 'Qualificação Equipe #2', questionText: 'Sensacional! Qual é o tamanho atual da sua equipe de vendas e suporte?' }, draggable: true },
    { id: '3', type: 'condition', position: { x: 800, y: 150 }, data: { label: 'Filtro Tamanho VIP #3', conditions: [{ value: 'Equipe > 5' }] }, draggable: true },
    { id: '4', type: 'action', position: { x: 1150, y: 50 }, data: { label: 'Marcar como Enterprise #4', actions: [{ type: 'tag_add', value: 'Insta_VIP_Enterprise' }, { type: 'tag_add', value: 'CRM_Sync_Urgente' }] }, draggable: true },
    { id: '5', type: 'action', position: { x: 1150, y: 280 }, data: { label: 'Marcar como Padrão #5', actions: [{ type: 'tag_add', value: 'Insta_Lead_Regular' }] }, draggable: true },
    { id: '6', type: 'delay', position: { x: 1500, y: 150 }, data: { label: 'Atraso Estratégico #6', time: '1 hora' }, draggable: true },
    { id: '7', type: 'message', position: { x: 1850, y: 150 }, data: { label: 'Oferta Especial Direct #7', content: 'Temos uma oferta exclusiva e personalizada para o tamanho da sua operação com a MassFlow! 🤖\n\nQue tal dar uma olhada e começar a disparar hoje mesmo?', buttons: [{ text: 'Ver Planos Promocionais' }] }, draggable: true },
    { id: '8', type: 'split', position: { x: 2200, y: 150 }, data: { label: 'Divisor Split Checkout #8', splitPercent: 50, labelA: 'Checkout Direto', labelB: 'Mentoria Inclusa' }, draggable: true },
    { id: '9', type: 'message', position: { x: 2550, y: 50 }, data: { label: 'Link Desconto Direto #9', content: 'Feche agora o plano básico com 50% de desconto imediato usando o link abaixo:', buttons: [{ text: 'Garantir Licença' }] }, draggable: true },
    { id: '10', type: 'message', position: { x: 2550, y: 280 }, data: { label: 'Link Bônus Mentoria #10', content: 'Feche o plano premium hoje e ganhe uma mentoria individual de configuração da API!', buttons: [{ text: 'Garantir Plano Premium' }] }, draggable: true },
    { id: '11', type: 'goto', position: { x: 2900, y: 150 }, data: { label: 'Voltar Início Funil #11', targetNodeId: '1' }, draggable: true }
  ],
  whatsapp: [
    { id: '1', type: 'message', position: { x: 100, y: 150 }, data: { label: 'Boas-vindas WhatsApp #1', content: 'Olá! Sou o consultor virtual da MassFlow. 🤖\nPronto para escalar sua operação e multiplicar seus disparos de mensagens em minutos?\n\nEscolha uma das opções abaixo para iniciarmos:', buttons: [{ text: 'Planos Corporativos B2B' }, { text: 'Falar com Atendente' }] }, draggable: true },
    { id: '2', type: 'question', position: { x: 450, y: 150 }, data: { label: 'Capturar Dados Lead #2', questionText: 'Perfeito! Digite seu e-mail profissional para podermos validar sua conta:', fields: [{ type: 'email', label: 'E-mail Corporativo' }] }, draggable: true },
    { id: '3', type: 'condition', position: { x: 800, y: 150 }, data: { label: 'Filtro Domínio E-mail #3', conditions: [{ value: 'Email contém "@"' }] }, draggable: true },
    { id: '4', type: 'action', position: { x: 1150, y: 50 }, data: { label: 'Definir Lead Quente #4', actions: [{ type: 'tag_add', value: 'WhatsApp_Lead_Hot' }, { type: 'tag_add', value: 'Valido' }] }, draggable: true },
    { id: '5', type: 'message', position: { x: 1150, y: 280 }, data: { label: 'Erro Validação E-mail #5', content: 'Ops! O e-mail digitado parece inválido. Certifique-se de digitar um e-mail válido com "@" e domínio correto.', buttons: [{ text: 'Tentar Novamente' }] }, draggable: true },
    { id: '6', type: 'delay', position: { x: 1500, y: 150 }, data: { label: 'Atraso Inteligente #6', time: '5 minutos' }, draggable: true },
    { id: '7', type: 'message', position: { x: 1850, y: 150 }, data: { label: 'Envio Catálogo Oficial #7', content: 'Show de bola! Dê uma olhada no nosso catálogo de planos e taxas de disparo da API:', buttons: [{ text: 'Ver Catálogo Completo' }] }, draggable: true },
    { id: '8', type: 'question', position: { x: 2200, y: 150 }, data: { label: 'Chave Pix Faturamento #8', questionText: 'Excelente. Qual é o seu número de telefone celular cadastrado no Pix para podermos liberar sua licença teste?' }, draggable: true },
    { id: '9', type: 'split', position: { x: 2550, y: 150 }, data: { label: 'Split Notificação Urgência #9', splitPercent: 50, labelA: 'Urgência 24h', labelB: 'Brinde VIP' }, draggable: true },
    { id: '10', type: 'message', position: { x: 2900, y: 50 }, data: { label: 'Notificação Urgente A #10', content: 'Atenção! Seu acesso ao plano de testes expira nas próximas 24 horas. Garanta sua vaga imediata!', buttons: [{ text: 'Liberar Licença' }] }, draggable: true },
    { id: '11', type: 'message', position: { x: 2900, y: 280 }, data: { label: 'Oferta Mentoria Grátis B #11', content: 'Compre hoje sua assinatura anual e ganhe mentoria de infraestrutura grátis!', buttons: [{ text: 'Garantir Licença + Bônus' }] }, draggable: true },
    { id: '12', type: 'goto', position: { x: 3250, y: 150 }, data: { label: 'Falar Comercial #12', targetNodeId: '1' }, draggable: true }
  ],
  linkedin: [
    { id: '1', type: 'message', position: { x: 100, y: 150 }, data: { label: 'Conexão Inicial LinkedIn #1', content: 'Olá! Agradeço por aceitar minha conexão no LinkedIn. 💼\n\nVi seu perfil e achei super alinhado com nossa solução corporativa de vendas corporativas. Gostaria de receber nossa apresentação?', buttons: [{ text: 'Ver Apresentação B2B' }] }, draggable: true },
    { id: '2', type: 'question', position: { x: 450, y: 150 }, data: { label: 'Cargo & Segmento #2', questionText: 'Excelente! Qual é o seu cargo atual e o segmento principal da sua empresa?' }, draggable: true },
    { id: '3', type: 'condition', position: { x: 800, y: 150 }, data: { label: 'Filtro Decisor Cargo #3', conditions: [{ value: 'Cargo contém "Diretor"' }, { value: 'Cargo contém "CEO"' }] }, draggable: true },
    { id: '4', type: 'action', position: { x: 1150, y: 50 }, data: { label: 'Marcar Decisor VIP #4', actions: [{ type: 'tag_add', value: 'LinkedIn_Decisor_B2B' }, { type: 'tag_add', value: 'Alta_Prioridade' }] }, draggable: true },
    { id: '5', type: 'action', position: { x: 1150, y: 280 }, data: { label: 'Marcar Lead Geral #5', actions: [{ type: 'tag_add', value: 'LinkedIn_Lead_Geral' }] }, draggable: true },
    { id: '6', type: 'delay', position: { x: 1500, y: 150 }, data: { label: 'Atraso Proposta #6', time: '1 hora' }, draggable: true },
    { id: '7', type: 'message', position: { x: 1850, y: 150 }, data: { label: 'Envio Apresentação PDF #7', content: 'Aqui está nossa proposta e apresentação completa em formato PDF para análise de custos!', buttons: [{ text: 'Baixar PDF Corporativo' }] }, draggable: true },
    { id: '8', type: 'split', position: { x: 2200, y: 150 }, data: { label: 'Split Teste Reunião A/B #8', splitPercent: 50, labelA: 'Reunião Direta Zoom', labelB: 'WhatsApp Gerente' }, draggable: true },
    { id: '9', type: 'message', position: { x: 2550, y: 50 }, data: { label: 'Convite Reunião Zoom #9', content: 'Que tal marcarmos uma demonstração rápida de 15 minutos pelo Zoom para avaliarmos sua demanda?', buttons: [{ text: 'Agendar pelo Calendly' }] }, draggable: true },
    { id: '10', type: 'message', position: { x: 2550, y: 280 }, data: { label: 'WhatsApp Gerente B2B #10', content: 'Prefere tirar dúvidas pelo WhatsApp corporativo rápido? Fale diretamente com nosso gerente abaixo:', buttons: [{ text: 'Chamar no WhatsApp B2B' }] }, draggable: true },
    { id: '11', type: 'goto', position: { x: 2900, y: 150 }, data: { label: 'Fim Funil LinkedIn #11', targetNodeId: '1' }, draggable: true }
  ],
  sandbox: []
};



const initialEdgesByPlatform = {
  tiktok: [
    { id: 'e-tk-1', source: '1', target: '2', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-2', source: '2', target: '3', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-3', source: '3', target: '4', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-4', source: '4', target: '5', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-5', source: '5', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-6', source: '5', target: '7', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-7', source: '6', target: '8', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-8', source: '7', target: '8', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-9', source: '8', target: '9', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-10', source: '9', target: '10', sourceHandle: 'cond-source-0', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-11', source: '9', target: '11', sourceHandle: 'cond-source-else', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-12', source: '10', target: '12', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-tk-13', source: '11', target: '12', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } }
  ],
  instagram: [
    { id: 'e-in-1', source: '1', target: '2', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-2', source: '2', target: '3', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-3', source: '3', target: '4', sourceHandle: 'cond-source-0', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-4', source: '3', target: '5', sourceHandle: 'cond-source-else', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-5', source: '4', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-6', source: '5', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-7', source: '6', target: '7', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-8', source: '7', target: '8', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-9', source: '8', target: '9', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-10', source: '8', target: '10', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-11', source: '9', target: '11', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-in-12', source: '10', target: '11', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } }
  ],
  whatsapp: [
    { id: 'e-wa-1', source: '1', target: '2', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-2', source: '2', target: '3', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-3', source: '3', target: '4', sourceHandle: 'cond-source-0', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-4', source: '3', target: '5', sourceHandle: 'cond-source-else', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-5', source: '4', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-6', source: '5', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-7', source: '6', target: '7', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-8', source: '7', target: '8', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-9', source: '8', target: '9', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-10', source: '9', target: '10', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-11', source: '9', target: '11', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-12', source: '10', target: '12', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-wa-13', source: '11', target: '12', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } }
  ],
  linkedin: [
    { id: 'e-li-1', source: '1', target: '2', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-2', source: '2', target: '3', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-3', source: '3', target: '4', sourceHandle: 'cond-source-0', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-4', source: '3', target: '5', sourceHandle: 'cond-source-else', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-5', source: '4', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-6', source: '5', target: '6', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-7', source: '6', target: '7', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-8', source: '7', target: '8', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-9', source: '8', target: '9', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-10', source: '8', target: '10', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-11', source: '9', target: '11', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } },
    { id: 'e-li-12', source: '10', target: '11', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#5EFF00', strokeWidth: 2 } }
  ],
  sandbox: []
};
