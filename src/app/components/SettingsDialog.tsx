import {
  Settings,
  Bell,
  Database,
  Download,
  Upload,
  Zap,
  UserCog,
  Shield,
  Plus,
  Pencil,
  Users,
  Trash2,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { getUsers, createUser, deleteUser, resetUserPassword, updateUser, type AppUser } from "../auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";

interface Lead {
  assignedTo: string;
  source: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  salesReps: string[];
  leadSources: string[];
  leads: Lead[];
  onAddTeamMember: (name: string, email: string, role: string) => void;
  onUpdateTeamMember: (oldName: string, newName: string, email: string, role: string) => void;
  currentUser?: AppUser | null;
}

export function SettingsDialog({ isOpen, onClose, salesReps, leadSources, leads, onAddTeamMember, onUpdateTeamMember, currentUser }: SettingsDialogProps) {
  const isAdmin = currentUser?.role === "admin";
  const [companyName, setCompanyName] = useState("GDI Digital Solutions");
  const [timezone, setTimezone] = useState("est");
  const [currency, setCurrency] = useState("usd");
  const [darkMode, setDarkMode] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("admin@gdidigital.com");
  
  // Team member management state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    role: "Sales Rep"
  });

  // User management state
  const [appUsers, setAppUsers] = useState<AppUser[]>(() => getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: "", displayName: "", role: "user" as "admin" | "user" });
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ id: "", username: "", displayName: "", role: "user" as "admin" | "user" });

  const refreshUsers = () => setAppUsers(getUsers());

  const handleCreateUser = () => {
    if (!newUserForm.username || !newUserForm.displayName) return;
    createUser(newUserForm.username, newUserForm.displayName, newUserForm.role);
    refreshUsers();
    // Also add them as a team member
    onAddTeamMember(newUserForm.displayName, newUserForm.username, "Sales Rep");
    setIsAddUserOpen(false);
    setNewUserForm({ username: "", displayName: "", role: "user" });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    refreshUsers();
  };

  const handleResetPassword = (userId: string) => {
    resetUserPassword(userId);
    refreshUsers();
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditUserForm({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    setIsEditUserOpen(true);
  };

  const handleEditUser = () => {
    if (!editUserForm.username || !editUserForm.displayName) return;
    const oldUser = appUsers.find(u => u.id === editUserForm.id);
    updateUser(editUserForm.id, editUserForm.displayName, editUserForm.username, editUserForm.role);
    refreshUsers();
    if (oldUser && oldUser.displayName !== editUserForm.displayName) {
      onUpdateTeamMember(oldUser.displayName, editUserForm.displayName, editUserForm.username, "Sales Rep");
    }
    setIsEditUserOpen(false);
  };

  const handleOpenAddMember = () => {
    setMemberForm({ name: "", email: "", role: "Sales Rep" });
    setIsAddMemberOpen(true);
  };

  const handleOpenEditMember = (memberName: string) => {
    setEditingMember(memberName);
    setMemberForm({
      name: memberName,
      email: `${memberName.toLowerCase().replace(' ', '.')}@gdidigital.com`,
      role: "Sales Rep"
    });
    setIsEditMemberOpen(true);
  };

  const handleAddMember = () => {
    if (memberForm.name && memberForm.email) {
      onAddTeamMember(memberForm.name, memberForm.email, memberForm.role);
      setIsAddMemberOpen(false);
      setMemberForm({ name: "", email: "", role: "Sales Rep" });
    }
  };

  const handleUpdateMember = () => {
    if (editingMember && memberForm.name && memberForm.email) {
      onUpdateTeamMember(editingMember, memberForm.name, memberForm.email, memberForm.role);
      setIsEditMemberOpen(false);
      setEditingMember(null);
      setMemberForm({ name: "", email: "", role: "Sales Rep" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your leads manager preferences and system settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-6" : "grid-cols-5"}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic configuration for your leads manager</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="cst">Central Time (CST)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-gray-500">Enable dark theme</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Team Management
                </CardTitle>
                <CardDescription>Manage sales reps and team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {salesReps.filter(rep => rep !== "Unassigned").map(rep => (
                    <div key={rep} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#4169E1] text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm">
                          {rep.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{rep}</div>
                          <div className="text-sm text-gray-500">
                            {leads.filter(l => l.assignedTo === rep).length} leads assigned
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditMember(rep)}>Edit</Button>
                    </div>
                  ))}
                </div>
                <Button className="w-full" variant="outline" onClick={handleOpenAddMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Assignment</CardTitle>
                <CardDescription>Configure how new leads are assigned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignment Method</Label>
                  <Select defaultValue="manual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Assignment</SelectItem>
                      <SelectItem value="roundrobin">Round Robin</SelectItem>
                      <SelectItem value="leastbusy">Least Busy</SelectItem>
                      <SelectItem value="territory">Territory Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </CardTitle>
                  <CardDescription>Create and manage user login accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {appUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`${user.role === "admin" ? "bg-amber-500" : "bg-[#4169E1]"} text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm`}>
                            {user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.displayName}
                              {user.role === "admin" && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Admin</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Username: {user.username}
                              {user.mustChangePassword && (
                                <span className="ml-2 text-xs text-orange-600">(must change password)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditUser(user)}
                            title="Edit user"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            title="Reset password to default"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete user"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User Account
                  </Button>
                  <p className="text-xs text-gray-400">
                    New accounts are created with the default password "password123". Users will be required to change it on first login.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="sources" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Lead Sources
                </CardTitle>
                <CardDescription>Manage and configure lead source channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {leadSources.map(source => (
                    <div key={source} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{source}</div>
                        <div className="text-sm text-gray-500">
                          {leads.filter(l => l.source === source).length} leads from this source
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Source
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control when and how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Lead Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified when new leads are captured</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders for upcoming tasks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lead Status Changes</Label>
                    <p className="text-sm text-gray-500">Notify when lead status is updated</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-gray-500">Receive daily summary emails</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send notifications to email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input id="notificationEmail" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Management
                </CardTitle>
                <CardDescription>Import, export, and manage your lead data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Import Leads</Label>
                  <p className="text-sm text-gray-500">Upload a CSV or Excel file to import leads</p>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import from CSV/Excel
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Export Leads</Label>
                  <p className="text-sm text-gray-500">Download all your leads data</p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Integrations
                </CardTitle>
                <CardDescription>Connect with external tools and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Gmail Integration</div>
                      <div className="text-sm text-gray-500">Connect your Gmail account</div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Google Ads</div>
                      <div className="text-sm text-gray-500">Track leads from Google Ads</div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Facebook Ads</div>
                      <div className="text-sm text-gray-500">Import leads from Facebook</div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Slack</div>
                      <div className="text-sm text-gray-500">Get notifications in Slack</div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Scoring Rules</CardTitle>
                <CardDescription>Configure automatic lead scoring criteria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Website visit: +10 points</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Email opened: +5 points</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Pricing page view: +15 points</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Form submission: +20 points</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#4169E1] hover:bg-[#3557c2]" onClick={onClose}>
            Save Changes
          </Button>
        </div>
      </DialogContent>

      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new sales representative to your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">Full Name *</Label>
              <Input
                id="memberName"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email *</Label>
              <Input
                id="memberEmail"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="john.doe@gdidigital.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <Select
                value={memberForm.role}
                onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Rep">Sales Rep</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Account Executive">Account Executive</SelectItem>
                  <SelectItem value="BDR">BDR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full bg-[#4169E1] hover:bg-[#3557c2]" 
              onClick={handleAddMember}
            >
              Add Team Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Account Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>
              Create a new login account. Username can be a name or email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newUserDisplayName">Display Name *</Label>
              <Input
                id="newUserDisplayName"
                value={newUserForm.displayName}
                onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserUsername">Username or Email *</Label>
              <Input
                id="newUserUsername"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                placeholder="johndoe or john@example.com"
              />
              <p className="text-xs text-gray-400">This is what they will use to log in</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserRole">Role</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as "admin" | "user" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg border border-blue-200">
              Default password will be <strong>password123</strong>. The user will be required to change it on first login.
            </div>
            <Button
              className="w-full bg-[#4169E1] hover:bg-[#3557c2]"
              onClick={handleCreateUser}
              disabled={!newUserForm.username || !newUserForm.displayName}
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Account Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
            <DialogDescription>
              Update user account details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editUserDisplayName">Display Name *</Label>
              <Input
                id="editUserDisplayName"
                value={editUserForm.displayName}
                onChange={(e) => setEditUserForm({ ...editUserForm, displayName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserUsername">Username or Email *</Label>
              <Input
                id="editUserUsername"
                value={editUserForm.username}
                onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                placeholder="johndoe or john@example.com"
              />
              <p className="text-xs text-gray-400">This is what they will use to log in</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserRole">Role</Label>
              <Select
                value={editUserForm.role}
                onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value as "admin" | "user" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[#4169E1] hover:bg-[#3557c2]"
              onClick={handleEditUser}
              disabled={!editUserForm.username || !editUserForm.displayName}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Dialog */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editMemberName">Full Name *</Label>
              <Input
                id="editMemberName"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMemberEmail">Email *</Label>
              <Input
                id="editMemberEmail"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="john.doe@gdidigital.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMemberRole">Role</Label>
              <Select
                value={memberForm.role}
                onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Rep">Sales Rep</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Account Executive">Account Executive</SelectItem>
                  <SelectItem value="BDR">BDR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full bg-[#4169E1] hover:bg-[#3557c2]" 
              onClick={handleUpdateMember}
            >
              Update Team Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}