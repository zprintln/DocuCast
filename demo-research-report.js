// demo-research-report.js
import { generateResearchReport } from './src/researchReport.js';

async function demoResearchReport() {
    console.log('🔬 SecureScholar Research Report Demo');
    console.log('=====================================\n');
    
    try {
        console.log('Generating research report for "machine learning healthcare"...');
        
        const report = await generateResearchReport('machine learning healthcare', {
            maxResults: 10,
            useFallbacks: true
        });
        
        console.log('\n✅ Research Report Generated Successfully!');
        console.log('==========================================');
        console.log(`📊 Title: ${report.title}`);
        console.log(`📚 Papers Analyzed: ${report.paperCount}`);
        console.log(`⏱️  Estimated Duration: ${Math.round(report.duration / 60)} minutes`);
        console.log(`🎧 Audio URL: ${report.audioUrl}`);
        console.log(`📅 Generated: ${report.createdAt}`);
        
        console.log('\n📖 Executive Summary:');
        console.log('====================');
        console.log(report.summary);
        
        console.log('\n📚 Key Papers:');
        console.log('==============');
        report.papers.slice(0, 3).forEach((paper, index) => {
            console.log(`\n${index + 1}. ${paper.title}`);
            console.log(`   Authors: ${paper.authors?.join(', ') || 'Unknown'}`);
            console.log(`   Venue: ${paper.venue || 'Unknown'}`);
            console.log(`   Importance: ${paper.importance}/10`);
            console.log(`   Summary: ${paper.summary.substring(0, 100)}...`);
        });
        
        console.log(`\n... and ${report.papers.length - 3} more papers`);
        
        console.log('\n🎯 Demo completed successfully!');
        console.log('You can now start the server and test the web interface:');
        console.log('npm start');
        console.log('Then visit http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

demoResearchReport();
