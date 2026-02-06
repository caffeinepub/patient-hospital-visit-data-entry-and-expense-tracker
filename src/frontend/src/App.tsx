import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, LogOut, User } from 'lucide-react';
import VisitEntryForm from './components/visit/VisitEntryForm';
import MyEntriesList from './components/visit/MyEntriesList';
import type { VisitEntry } from './backend';

export default function App() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  
  const [profileName, setProfileName] = useState('');
  const [editingEntry, setEditingEntry] = useState<VisitEntry | null>(null);
  const [activeTab, setActiveTab] = useState('new-entry');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    setEditingEntry(null);
    setActiveTab('new-entry');
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    await saveProfile.mutateAsync({ name: profileName.trim() });
    setProfileName('');
  };

  const handleEditEntry = (entry: VisitEntry) => {
    setEditingEntry(entry);
    setActiveTab('new-entry');
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleSaveComplete = () => {
    setEditingEntry(null);
    setActiveTab('my-entries');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Patient Visit Tracker</h1>
                <p className="text-sm text-muted-foreground">Hospital visit and expense records</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to manage your hospital visit records and track medical expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="w-full"
                size="lg"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t border-border py-6 bg-card">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © 2026. Built with love using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Patient Visit Tracker</h1>
                {userProfile && (
                  <p className="text-sm text-muted-foreground">Welcome, {userProfile.name}</p>
                )}
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="new-entry">
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </TabsTrigger>
              <TabsTrigger value="my-entries">My Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="new-entry" className="mt-0">
              <VisitEntryForm 
                editingEntry={editingEntry}
                onCancelEdit={handleCancelEdit}
                onSaveComplete={handleSaveComplete}
              />
            </TabsContent>

            <TabsContent value="my-entries" className="mt-0">
              <MyEntriesList onEditEntry={handleEditEntry} />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t border-border py-6 bg-card mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © 2026. Built with love using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>

      <Dialog open={showProfileSetup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please enter your name to continue using the application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Your Name</Label>
              <Input
                id="profile-name"
                placeholder="Enter your full name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && profileName.trim()) {
                    handleSaveProfile();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSaveProfile}
              disabled={!profileName.trim() || saveProfile.isPending}
              className="w-full"
            >
              {saveProfile.isPending ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
