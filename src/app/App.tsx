import { useState } from "react";
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  List,
  LayoutGrid,
  Star,
  Clock,
  MessageSquare,
  BarChart3,
  Settings,
  Pencil,
  Video,
  FileText,
  AlertCircle,
  DollarSign as PricingIcon,
  Send,
  Archive,
  ArchiveRestore,
  LogOut
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { SettingsDialog } from "./components/SettingsDialog";
import { LoginScreen } from "./components/LoginScreen";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { getSession, setSession, clearSession, getUsers, type AppUser } from "./auth";
import logo from "../assets/ce8d117a995a5a85f88957aad4cbbb801c7516f2.png";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  value: number;
  source: string;
  createdAt: string;
  assignedTo: string;
  score: number;
  lastContact?: string;
  archived?: boolean;
  notes: Note[];
  tasks: Task[];
  activities: Activity[];
}

interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Activity {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "linkedin" | "demo" | "proposal" | "contract" | "follow-up" | "pricing" | "objection";
  description: string;
  timestamp: string;
}

const leadSources = [
  "Website",
  "Google Ads",
  "Facebook Ads",
  "LinkedIn",
  "Referral",
  "Cold Outreach",
  "Email Campaign",
  "Trade Show",
  "Direct"
];


export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getSession());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesReps, setSalesReps] = useState<string[]>(() => {
    const users = getUsers();
    const names = users.map(u => u.displayName);
    return [...names, "Unassigned"];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "new" as Lead["status"],
    value: "",
    source: "Website",
    assignedTo: "Unassigned"
  });

  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState({ title: "", dueDate: "" });
  const [newActivity, setNewActivity] = useState({ 
    type: "call" as Activity["type"], 
    description: "" 
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesAssigned = assignedFilter === "all" || lead.assignedTo === assignedFilter;
    const matchesArchived = showArchived ? lead.archived === true : !lead.archived;
    return matchesSearch && matchesStatus && matchesSource && matchesAssigned && matchesArchived;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    converted: leads.filter(l => l.status === "won").length,
    totalValue: leads.reduce((sum, l) => sum + l.value, 0),
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length),
    hot: leads.filter(l => l.score >= 80).length
  };

  const statusCounts = {
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    proposal: leads.filter(l => l.status === "proposal").length,
    won: leads.filter(l => l.status === "won").length,
    lost: leads.filter(l => l.status === "lost").length
  };

  const handleAddLead = () => {
    if (editingLead) {
      // Update existing lead
      const updatedLeads = leads.map(lead => {
        if (lead.id === editingLead.id) {
          return {
            ...lead,
            name: newLead.name,
            email: newLead.email,
            phone: newLead.phone,
            company: newLead.company,
            status: newLead.status,
            value: parseFloat(newLead.value) || 0,
            source: newLead.source,
            assignedTo: newLead.assignedTo,
            activities: [
              {
                id: Date.now().toString(),
                type: "note" as const,
                description: "Lead information updated",
                timestamp: new Date().toLocaleString()
              },
              ...lead.activities
            ]
          };
        }
        return lead;
      });
      
      setLeads(updatedLeads);
      
      // Update selected lead if it's the one being edited
      if (selectedLead && selectedLead.id === editingLead.id) {
        const updated = updatedLeads.find(l => l.id === editingLead.id);
        if (updated) setSelectedLead(updated);
      }
    } else {
      // Add new lead
      const lead: Lead = {
        id: (leads.length + 1).toString(),
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        company: newLead.company,
        status: newLead.status,
        value: parseFloat(newLead.value) || 0,
        source: newLead.source,
        createdAt: new Date().toISOString().split('T')[0],
        assignedTo: newLead.assignedTo,
        score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        notes: [],
        tasks: [],
        activities: [
          {
            id: "1",
            type: "note",
            description: "Lead created",
            timestamp: new Date().toLocaleString()
          }
        ]
      };
      
      setLeads([lead, ...leads]);
    }
    
    setNewLead({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "new",
      value: "",
      source: "Website",
      assignedTo: "Unassigned"
    });
    setEditingLead(null);
    setIsAddDialogOpen(false);
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNote) return;
    
    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        const updatedLead = {
          ...lead,
          notes: [
            ...lead.notes,
            {
              id: Date.now().toString(),
              text: newNote,
              createdAt: new Date().toISOString().split('T')[0],
              author: "Current User"
            }
          ],
          activities: [
            {
              id: Date.now().toString(),
              type: "note" as const,
              description: `Note added: ${newNote.substring(0, 50)}...`,
              timestamp: new Date().toLocaleString()
            },
            ...lead.activities
          ]
        };
        setSelectedLead(updatedLead);
        return updatedLead;
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setNewNote("");
  };

  const handleAddTask = () => {
    if (!selectedLead || !newTask.title || !newTask.dueDate) return;
    
    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        const updatedLead = {
          ...lead,
          tasks: [
            ...lead.tasks,
            {
              id: Date.now().toString(),
              title: newTask.title,
              dueDate: newTask.dueDate,
              completed: false
            }
          ]
        };
        setSelectedLead(updatedLead);
        return updatedLead;
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setNewTask({ title: "", dueDate: "" });
  };

  const handleAddActivity = () => {
    if (!selectedLead || !newActivity.description) return;
    
    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        const updatedLead = {
          ...lead,
          activities: [
            ...lead.activities,
            {
              id: Date.now().toString(),
              type: newActivity.type,
              description: newActivity.description,
              timestamp: new Date().toLocaleString()
            }
          ]
        };
        setSelectedLead(updatedLead);
        return updatedLead;
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setNewActivity({ type: "call", description: "" });
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      value: lead.value.toString(),
      source: lead.source,
      assignedTo: lead.assignedTo
    });
    setIsAddDialogOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsPanelOpen(true);
  };

  const getStatusColor = (status: Lead["status"]) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-purple-100 text-purple-800",
      proposal: "bg-indigo-100 text-indigo-800",
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800"
    };
    return colors[status];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleAddTeamMember = (name: string, _email: string, _role: string) => {
    // Add new team member to the list (before "Unassigned"), skip if already present
    if (salesReps.includes(name)) return;
    const newReps = [...salesReps.filter(rep => rep !== "Unassigned"), name, "Unassigned"];
    setSalesReps(newReps);
  };

  const handleUpdateTeamMember = (oldName: string, newName: string, _email: string, _role: string) => {
    // Update team member name
    const updatedReps = salesReps.map(rep => rep === oldName ? newName : rep);
    setSalesReps(updatedReps);
    
    // Update all leads assigned to the old name
    if (oldName !== newName) {
      const updatedLeads = leads.map(lead => 
        lead.assignedTo === oldName ? { ...lead, assignedTo: newName } : lead
      );
      setLeads(updatedLeads);
      
      // Update selected lead if needed
      if (selectedLead && selectedLead.assignedTo === oldName) {
        setSelectedLead({ ...selectedLead, assignedTo: newName });
      }
    }
  };

  const handleArchiveLead = () => {
    if (!selectedLead) return;
    
    const isArchived = selectedLead.archived;
    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        const updatedLead = {
          ...lead,
          archived: !isArchived,
          activities: [
            {
              id: Date.now().toString(),
              type: "note" as const,
              description: isArchived ? "Lead unarchived" : "Lead archived",
              timestamp: new Date().toLocaleString()
            },
            ...lead.activities
          ]
        };
        setSelectedLead(updatedLead);
        return updatedLead;
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setIsDetailsPanelOpen(false);
  };

  const handleLogin = (user: AppUser) => {
    setSession(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const handlePasswordChanged = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show forced password change if required
  if (currentUser.mustChangePassword) {
    return <ChangePasswordDialog user={currentUser} onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-[#4169E1] text-white shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="GDI Digital Solutions" className="h-10 bg-white px-3 py-1.5 rounded" />
              <div>
                <h1 className="text-2xl font-bold">Leads Manager</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">{currentUser.displayName}</span>
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-[#4169E1] hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
                    <DialogDescription>
                      {editingLead ? "Update lead information" : "Capture new lead information into the system."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newLead.name}
                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={newLead.company}
                        onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Estimated Value ($)</Label>
                      <Input
                        id="value"
                        type="number"
                        value={newLead.value}
                        onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Lead Source *</Label>
                      <Select
                        value={newLead.source}
                        onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadSources.map(source => (
                            <SelectItem key={source} value={source}>{source}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assigned">Assign To</Label>
                      <Select
                        value={newLead.assignedTo}
                        onValueChange={(value) => setNewLead({ ...newLead, assignedTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {salesReps.map(rep => (
                            <SelectItem key={rep} value={rep}>{rep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select
                        value={newLead.status}
                        onValueChange={(value) => setNewLead({ ...newLead, status: value as Lead["status"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal Sent</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full bg-[#4169E1] hover:bg-[#3557c2]" 
                      onClick={handleAddLead}
                    >
                      {editingLead ? "Update Lead" : "Add Lead"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex-1 flex flex-col overflow-hidden w-full">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 shrink-0">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Total Leads</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-[#4169E1]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">New Leads</p>
                  <p className="text-xl font-bold text-gray-900">{stats.new}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Converted</p>
                  <p className="text-xl font-bold text-gray-900">{stats.converted}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Avg Score</p>
                  <p className="text-xl font-bold text-gray-900">{stats.avgScore}</p>
                </div>
                <div className="bg-pink-100 p-2 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Hot Leads</p>
                  <p className="text-xl font-bold text-gray-900">{stats.hot}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-lg">
                  <Star className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card className="mb-4 shrink-0">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {leadSources.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reps</SelectItem>
                    {salesReps.map(rep => (
                      <SelectItem key={rep} value={rep}>{rep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className={showArchived ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? "Viewing Archived" : "Archived"}
                  {leads.filter(l => l.archived).length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                      {leads.filter(l => l.archived).length}
                    </Badge>
                  )}
                </Button>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className="rounded-l-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List View */}
        {viewMode === "list" && (
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => openLeadDetails(lead)}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <div className="bg-[#4169E1] text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Building2 className="h-3 w-3 mr-1" />
                                {lead.company}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              {lead.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-gray-400" />
                              {lead.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge className={`${getStatusColor(lead.status)} capitalize`}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Star className={`h-4 w-4 ${getScoreColor(lead.score)}`} fill="currentColor" />
                            <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-semibold text-gray-900">
                            ${lead.value.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-700">{lead.assignedTo}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-700">{lead.source}</div>
                        </td>
                        <td className="px-4 py-2">
                          {lead.tasks.length > 0 ? (
                            <div className="space-y-1">
                              {lead.tasks.filter(t => !t.completed).slice(0, 2).map(task => (
                                <div key={task.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{task.title}</span>
                                </div>
                              ))}
                              {lead.tasks.filter(t => !t.completed).length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{lead.tasks.filter(t => !t.completed).length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">No tasks</div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-2 text-gray-400" />
                            {lead.lastContact || "Never"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No leads found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-1 min-h-0 overflow-auto">
            {(["new", "contacted", "qualified", "proposal", "won", "lost"] as const).map(status => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    <span>{status}</span>
                    <Badge variant="outline" className="ml-2">
                      {statusCounts[status]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredLeads.filter(l => l.status === status).map(lead => (
                    <Card 
                      key={lead.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openLeadDetails(lead)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium text-sm mb-2">{lead.name}</div>
                        <div className="text-xs text-gray-500 mb-2">{lead.company}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-gray-900">
                            ${(lead.value / 1000).toFixed(0)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className={`h-3 w-3 ${getScoreColor(lead.score)}`} fill="currentColor" />
                            <span className={`text-xs ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                          </div>
                        </div>
                        {lead.tasks.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {lead.tasks.filter(t => !t.completed).length} tasks
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 text-center text-gray-500 text-xs shrink-0">
          <p>© 2026 GDI Digital Solutions. All rights reserved.</p>
        </div>
      </div>

      {/* Lead Details Side Panel */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="bg-[#4169E1] text-white rounded-full h-12 w-12 flex items-center justify-center font-semibold">
                    {selectedLead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xl">{selectedLead.name}</div>
                    <div className="text-sm text-gray-500 font-normal">{selectedLead.company}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Lead details, activity timeline, and follow-ups
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(selectedLead.score)}`}>
                        {selectedLead.score}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Lead Score</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        ${(selectedLead.value / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Est. Value</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Badge className={getStatusColor(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">Status</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Contact Information</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditLead(selectedLead)}
                        >
                          <Pencil className="h-3 w-3 mr-2" />
                          Edit Lead
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleArchiveLead}
                        >
                          {selectedLead.archived ? (
                            <><ArchiveRestore className="h-3 w-3 mr-2" /> Unarchive</>
                          ) : (
                            <><Archive className="h-3 w-3 mr-2" /> Archive</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${selectedLead.email}`} className="text-sm text-blue-600 hover:underline">
                        {selectedLead.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${selectedLead.phone}`} className="text-sm text-blue-600 hover:underline">
                        {selectedLead.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{selectedLead.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Created: {selectedLead.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Assigned to: {selectedLead.assignedTo}</span>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="activity" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>

                  <TabsContent value="activity" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Activity Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedLead.activities.map(activity => (
                            <div key={activity.id} className="flex gap-3 border-l-2 border-gray-200 pl-4 pb-4">
                              <div className="flex-shrink-0 mt-1">
                                {activity.type === "email" && <Mail className="h-4 w-4 text-blue-500" />}
                                {activity.type === "call" && <Phone className="h-4 w-4 text-green-500" />}
                                {activity.type === "meeting" && <Calendar className="h-4 w-4 text-purple-500" />}
                                {activity.type === "note" && <MessageSquare className="h-4 w-4 text-gray-500" />}
                                {activity.type === "linkedin" && <Send className="h-4 w-4 text-blue-600" />}
                                {activity.type === "demo" && <Video className="h-4 w-4 text-indigo-500" />}
                                {activity.type === "proposal" && <FileText className="h-4 w-4 text-orange-500" />}
                                {activity.type === "contract" && <FileText className="h-4 w-4 text-green-600" />}
                                {activity.type === "follow-up" && <Clock className="h-4 w-4 text-yellow-500" />}
                                {activity.type === "pricing" && <PricingIcon className="h-4 w-4 text-emerald-500" />}
                                {activity.type === "objection" && <AlertCircle className="h-4 w-4 text-red-500" />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">{activity.description}</div>
                                <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Add Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="activityType">Type</Label>
                            <Select
                              value={newActivity.type}
                              onValueChange={(value) => setNewActivity({ ...newActivity, type: value as Activity["type"] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="call">📞 Phone Call</SelectItem>
                                <SelectItem value="email">📧 Email Sent</SelectItem>
                                <SelectItem value="meeting">📅 Meeting</SelectItem>
                                <SelectItem value="linkedin">💼 LinkedIn Message</SelectItem>
                                <SelectItem value="demo">🎥 Demo/Presentation</SelectItem>
                                <SelectItem value="proposal">📄 Proposal Sent</SelectItem>
                                <SelectItem value="contract">✅ Contract Sent</SelectItem>
                                <SelectItem value="follow-up">⏰ Follow-up Activity</SelectItem>
                                <SelectItem value="pricing">💰 Pricing Discussion</SelectItem>
                                <SelectItem value="objection">⚠️ Objection Handling</SelectItem>
                                <SelectItem value="note">📝 General Note</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="activityDescription">Description</Label>
                            <Textarea 
                              id="activityDescription"
                              placeholder="Add a description of the activity..."
                              value={newActivity.description}
                              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={handleAddActivity}
                            className="w-full bg-[#4169E1] hover:bg-[#3557c2]"
                            disabled={!newActivity.description.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Activity
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Add Note</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Textarea 
                            placeholder="Add a note about this lead..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3}
                          />
                          <Button 
                            onClick={handleAddNote}
                            className="w-full bg-[#4169E1] hover:bg-[#3557c2]"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Notes History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedLead.notes.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                          ) : (
                            selectedLead.notes.map(note => (
                              <div key={note.id} className="border-b pb-3 last:border-0">
                                <div className="text-sm text-gray-900">{note.text}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {note.author} • {note.createdAt}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tasks" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Add Follow-up Task</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="taskTitle">Task</Label>
                            <Input 
                              id="taskTitle"
                              placeholder="e.g., Send proposal"
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="taskDate">Due Date</Label>
                            <Input 
                              id="taskDate"
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            />
                          </div>
                          <Button 
                            onClick={handleAddTask}
                            className="w-full bg-[#4169E1] hover:bg-[#3557c2]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Upcoming Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedLead.tasks.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No tasks scheduled</p>
                          ) : (
                            selectedLead.tasks.map(task => (
                              <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due: {task.dueDate}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        salesReps={salesReps}
        leadSources={leadSources}
        leads={leads}
        onAddTeamMember={handleAddTeamMember}
        onUpdateTeamMember={handleUpdateTeamMember}
        currentUser={currentUser}
      />
    </div>
  );
}