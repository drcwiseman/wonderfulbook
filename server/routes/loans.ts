import { Router } from 'express';
import { db } from '../db.js';
import { loans, books, users } from '../../shared/schema.js';
import { eq, and, count, desc } from 'drizzle-orm';
import { isAuthenticated, requireAdmin } from '../middleware/auth.js';
import { LoanService } from '../services/loanService.js';

const router = Router();

// Create a new loan (borrow a book)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { bookId, loanType = 'subscription' } = req.body;
    const userId = req.user!.id;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if user can borrow
    const borrowCheck = await LoanService.canUserBorrow(userId);
    if (!borrowCheck.canBorrow) {
      return res.status(409).json({
        message: borrowCheck.reason,
        activeLoans: borrowCheck.activeLoans,
        maxLoans: borrowCheck.maxLoans
      });
    }

    const loan = await LoanService.createLoan(userId, bookId, loanType);

    res.status(201).json({
      message: 'Book borrowed successfully',
      loan: {
        id: loan.id,
        bookId: loan.bookId,
        status: loan.status,
        loanType: loan.loanType,
        startedAt: loan.startedAt
      }
    });

  } catch (error) {
    console.error('Loan creation failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Loan limit reached') || 
          error.message.includes('already have an active loan')) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.includes('Book not found')) {
        return res.status(404).json({ message: error.message });
      }
    }
    
    res.status(500).json({ message: 'Failed to create loan' });
  }
});

// Return a loan
router.post('/:loanId/return', isAuthenticated, async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user!.id;

    await LoanService.returnLoan(loanId, userId);

    res.json({ message: 'Book returned successfully' });

  } catch (error) {
    console.error('Loan return failed:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Failed to return loan' });
  }
});

// Get user's loans
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const userLoans = await LoanService.getUserLoans(
      userId, 
      status as 'active' | 'returned' | 'revoked' | undefined
    );

    // Transform the data to include book details
    const formattedLoans = userLoans.map(loan => ({
      id: loan.id,
      status: loan.status,
      loanType: loan.loanType,
      startedAt: loan.startedAt,
      returnedAt: loan.returnedAt,
      revokedAt: loan.revokedAt,
      revokeReason: loan.revokeReason,
      book: {
        id: loan.book.id,
        title: loan.book.title,
        author: loan.book.author,
        coverImageUrl: loan.book.coverImageUrl,
        description: loan.book.description
      }
    }));

    // Get loan summary
    const activeCount = await LoanService.getActiveLoansCount(userId);
    const borrowCheck = await LoanService.canUserBorrow(userId);

    res.json({
      loans: formattedLoans,
      summary: {
        activeLoans: activeCount,
        maxLoans: borrowCheck.maxLoans,
        canBorrow: borrowCheck.canBorrow
      }
    });

  } catch (error) {
    console.error('Failed to fetch loans:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// Get loan statistics (admin only)
router.get('/statistics', requireAdmin, async (req, res) => {
  try {
    const stats = await LoanService.getLoanStatistics();
    res.json(stats);

  } catch (error) {
    console.error('Failed to fetch loan statistics:', error);
    res.status(500).json({ message: 'Failed to fetch loan statistics' });
  }
});

// Get all active loans (admin only)
router.get('/admin/active', requireAdmin, async (req, res) => {
  try {
    const activeLoans = await LoanService.getAllActiveLoans();
    
    const formattedLoans = activeLoans.map(loan => ({
      id: loan.id,
      status: loan.status,
      loanType: loan.loanType,
      startedAt: loan.startedAt,
      user: {
        id: loan.user.id,
        email: loan.user.email,
        name: `${loan.user.firstName || ''} ${loan.user.lastName || ''}`.trim()
      },
      book: {
        id: loan.book.id,
        title: loan.book.title,
        author: loan.book.author
      }
    }));

    res.json({ loans: formattedLoans });

  } catch (error) {
    console.error('Failed to fetch active loans:', error);
    res.status(500).json({ message: 'Failed to fetch active loans' });
  }
});

// Revoke a loan (admin only)
router.post('/:loanId/revoke', requireAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    await LoanService.revokeLoan(loanId, adminId, reason);

    res.json({ message: 'Loan revoked successfully' });

  } catch (error) {
    console.error('Loan revocation failed:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Failed to revoke loan' });
  }
});

// Return all loans for a user (admin only)
router.post('/admin/users/:userId/return-all', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Returned by admin' } = req.body;

    await LoanService.returnAllUserLoans(userId, reason);

    res.json({ message: 'All user loans returned successfully' });

  } catch (error) {
    console.error('Bulk loan return failed:', error);
    res.status(500).json({ message: 'Failed to return user loans' });
  }
});

export default router;