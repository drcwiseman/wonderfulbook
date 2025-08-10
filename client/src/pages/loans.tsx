import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Book, Calendar, Download, RotateCcw, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

interface Loan {
  id: string;
  status: 'active' | 'returned' | 'revoked';
  loanType: 'subscription' | 'trial';
  startedAt: string;
  returnedAt?: string;
  revokedAt?: string;
  revokeReason?: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string;
    description?: string;
  };
}

interface LoanSummary {
  activeLoans: number;
  maxLoans: number;
  canBorrow: boolean;
}

export default function LoansPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'revoked'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's loans
  const { data: loansData, isLoading } = useQuery({
    queryKey: ['/api/loans', statusFilter === 'all' ? undefined : statusFilter].filter(Boolean),
  });

  // Return loan mutation
  const returnLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to return loan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      toast({
        title: 'Book returned successfully',
        description: 'The book has been returned and removed from your library',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Return failed',
        description: error.message || 'Failed to return book',
        variant: 'destructive',
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'returned':
        return 'secondary';
      case 'revoked':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Book className="h-4 w-4" />;
      case 'returned':
        return <RotateCcw className="h-4 w-4" />;
      case 'revoked':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const loans: Loan[] = (loansData as any)?.loans || [];
  const summary: LoanSummary = (loansData as any)?.summary || { activeLoans: 0, maxLoans: 20, canBorrow: true };

  const filteredLoans = statusFilter === 'all' 
    ? loans 
    : loans.filter(loan => loan.status === statusFilter);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Borrowed Books</h1>
          <p className="text-gray-600 mt-2">
            Manage your active book loans and reading history
          </p>
        </div>

        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Loan Summary</span>
              <Link href="/store">
                <Button size="sm" disabled={!summary.canBorrow}>
                  <Download className="h-4 w-4 mr-2" />
                  Borrow More Books
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Track your current borrowing status and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Active Loans</span>
                  <span className="text-sm text-gray-600">
                    {summary.activeLoans} / {summary.maxLoans}
                  </span>
                </div>
                <Progress 
                  value={(summary.activeLoans / summary.maxLoans) * 100} 
                  className="h-2"
                />
              </div>
              
              {!summary.canBorrow && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    You've reached your loan limit. Return a book to borrow another.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'returned', 'revoked'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Loans' : `${status} Books`}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {loans.filter(loan => loan.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Loans List */}
        <div>
          {filteredLoans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Book className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No {statusFilter === 'all' ? '' : statusFilter} loans found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {statusFilter === 'active' 
                    ? 'Browse the store to borrow your first book'
                    : 'Loans will appear here when available'
                  }
                </p>
                {statusFilter === 'active' && (
                  <Link href="/store">
                    <Button className="mt-4">
                      Browse Books
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredLoans.map((loan) => (
                <Card key={loan.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Book Cover */}
                      <div className="flex-shrink-0">
                        {loan.book.coverImageUrl ? (
                          <img
                            src={loan.book.coverImageUrl}
                            alt={loan.book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <Book className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-lg truncate">
                              {loan.book.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              by {loan.book.author}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={getStatusColor(loan.status)}>
                              {getStatusIcon(loan.status)}
                              <span className="ml-1 capitalize">{loan.status}</span>
                            </Badge>
                            
                            {loan.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => returnLoanMutation.mutate(loan.id)}
                                disabled={returnLoanMutation.isPending}
                              >
                                Return Book
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Loan Details */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Borrowed: {formatDate(loan.startedAt)}
                          </div>
                          
                          {loan.returnedAt && (
                            <div className="flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" />
                              Returned: {formatDate(loan.returnedAt)}
                            </div>
                          )}
                          
                          {loan.revokedAt && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Revoked: {formatDate(loan.revokedAt)}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {loan.loanType === 'trial' ? 'Free Trial' : 'Subscription'}
                            </Badge>
                          </div>
                        </div>

                        {/* Revoke Reason */}
                        {loan.revokeReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                            <span className="font-medium">Reason: </span>
                            {loan.revokeReason}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {loan.status === 'active' && (
                          <div className="mt-3 flex gap-2">
                            <Link href={`/read/${loan.book.id}`}>
                              <Button size="sm">
                                Continue Reading
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">About Book Loans</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You can borrow up to {summary.maxLoans} books at a time</li>
              <li>• Books remain available for the duration of your subscription</li>
              <li>• Returning a book frees up a loan slot for another book</li>
              <li>• Download books to registered devices for offline reading</li>
              <li>• Offline access expires after 30 days and requires renewal</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}